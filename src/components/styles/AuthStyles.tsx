export const authStyles = {
  container: `min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 
    flex items-center justify-center p-4 relative overflow-hidden`,
  
  glowEffect: `before:content-[''] before:absolute before:w-96 before:h-96 
    before:bg-purple-600 before:rounded-full before:blur-3xl before:opacity-20 before:-z-10
    after:content-[''] after:absolute after:w-96 after:h-96 
    after:bg-blue-600 after:rounded-full after:blur-3xl after:opacity-20 after:-z-10
    after:animate-pulse`,
  
  formContainer: `w-full max-w-md backdrop-blur-xl bg-white/10 p-8 rounded-2xl 
    shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] border border-white/20`,
  
  heading: `text-4xl font-bold text-transparent bg-clip-text 
    bg-gradient-to-r from-blue-400 to-purple-400 text-center mb-2`,
  
  subHeading: `text-center text-gray-300 mb-8`,
  
  link: `text-blue-400 hover:text-blue-300 transition-colors duration-200`,
  
  inputContainer: `space-y-5`,
  
  label: `block text-sm font-medium text-gray-300 mb-1`,
  
  input: `w-full px-4 py-3 rounded-lg bg-gray-900/50 border border-gray-700 
    text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 
    focus:ring-blue-500 focus:border-transparent transition-all duration-200`,
  
  button: `w-full py-3 px-4 mt-6 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 
    text-white font-medium hover:from-blue-500 hover:to-purple-500 
    focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 
    focus:ring-offset-gray-900 transition-all duration-200
    disabled:opacity-50 disabled:cursor-not-allowed
    transform hover:scale-[1.02] active:scale-[0.98]`,
  
  errorContainer: `rounded-lg bg-red-900/50 border border-red-800 p-4 mt-4`,
  errorText: `text-sm text-red-400`,
  
  successContainer: `rounded-lg bg-green-900/50 border border-green-800 p-4 mt-4`,
  successText: `text-sm text-green-400`,
}; 