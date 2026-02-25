import { createClient } from '@supabase/supabase-js'

export const supabaseUrl = 'https://ojdwttnyobydstokayyt.supabase.co'
export const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qZHd0dG55b2J5ZHN0b2theXl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5Nzk3MTUsImV4cCI6MjA4NzU1NTcxNX0.k3SMg8VxI-22RocjPCXvLzRodW9M1gsKHyoZJABC8zw'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
