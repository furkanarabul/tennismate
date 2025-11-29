
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://oczdhazljqnyxjssspnn.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9jemRoYXpsanFueXhqc3NzcG5uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxOTQ0ODksImV4cCI6MjA3OTc3MDQ4OX0.GH3sfQo1vvL_gGc50ZwQXA1qhr1Pam_M7-G1BZr-5F0'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkProfile() {
    const email = 'arabulfurkan@outlook.com'
    console.log(`Checking profile for ${email}...`)

    const { data, error } = await supabase
        .from('profiles')
        .select('id, name, email, latitude, longitude, location')
        .eq('email', email)
        .single()

    if (error) {
        console.error('Error:', error)
    } else {
        console.log('Profile Data:', data)
    }
}

checkProfile()
