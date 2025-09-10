import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface CreateTrainerRequest {
  name: string;
  cpf: string;
  email: string;
  phone?: string;
  birth_date?: string;
  cref?: string;
  specializations?: string[];
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create Supabase client with service role key for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Create regular client to verify the requesting user
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    // Verify the requesting user is authenticated
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check if user is a super admin
    const superAdminEmail = 'guthierresc@hotmail.com'
    if (user.email !== superAdminEmail) {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Parse request body
    const requestData: CreateTrainerRequest = await req.json()

    // Validate required fields
    if (!requestData.name || !requestData.cpf || !requestData.email) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: name, cpf, email' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Generate temporary password
    const tempPassword = 'temp123456'

    // Create user in Supabase Auth
    const { data: authData, error: authError2 } = await supabaseAdmin.auth.admin.createUser({
      email: requestData.email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        name: requestData.name,
        role: 'personal_trainer'
      }
    })

    if (authError2) {
      console.error('Auth creation error:', authError2)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to create user account',
          details: authError2.message 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Prepare trainer data for database
    let dbBirthDate = null
    if (requestData.birth_date) {
      if (requestData.birth_date.includes('/')) {
        const [day, month, year] = requestData.birth_date.split("/")
        if (day && month && year) {
          dbBirthDate = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
        }
      } else {
        dbBirthDate = requestData.birth_date
      }
    }

    const trainerData = {
      name: requestData.name,
      cpf: requestData.cpf.replace(/\D/g, ""),
      email: requestData.email,
      phone: requestData.phone || null,
      birth_date: dbBirthDate,
      cref: requestData.cref || null,
      specializations: requestData.specializations && requestData.specializations.length > 0 ? requestData.specializations : null,
      active: true,
      auth_user_id: authData.user.id,
    }

    // Insert trainer into database
    const { error: dbError } = await supabaseAdmin
      .from("personal_trainers")
      .insert(trainerData)

    if (dbError) {
      // If trainer creation fails, delete the auth user
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      
      console.error('Database error:', dbError)
      
      let errorMessage = 'Failed to create personal trainer'
      if (dbError.code === '23505' && dbError.details?.includes('cpf')) {
        errorMessage = 'A personal trainer with this CPF already exists'
      }
      
      return new Response(
        JSON.stringify({ 
          error: errorMessage,
          details: dbError.message 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Return success response
    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Personal trainer ${requestData.name} created successfully`,
        tempPassword: tempPassword
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
