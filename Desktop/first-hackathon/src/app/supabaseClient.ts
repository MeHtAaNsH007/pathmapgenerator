import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://jtbyrnlbbxnjyipxajmt.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0YnlybmxiYnhuanlpcHhham10Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5OTExMzMsImV4cCI6MjA4NjU2NzEzM30.xBKQ0Q2t54E93Ra_SEvi9cPp-1WtwvYmQU-ByWTydwQ'

export const supabase = createClient(supabaseUrl, supabaseKey)