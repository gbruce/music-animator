export const timelineStyles = {
  container: `min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 
    flex flex-col p-4 relative overflow-hidden`,
  
  glowEffect: `before:content-[''] before:absolute before:w-96 before:h-96 
    before:bg-purple-600 before:rounded-full before:blur-3xl before:opacity-20 before:-z-10 before:animate-pulse
    after:content-[''] after:absolute after:w-96 after:h-96 
    after:bg-blue-600 after:rounded-full after:blur-3xl after:opacity-20 after:-z-10
    after:animate-pulse after:animation-delay-2000`,
  
  contentContainer: `w-full`,
  
  userInfoContainer: `absolute top-4 right-4 flex items-center gap-4`,
  
  username: `text-gray-300 font-medium`,
  
  logoutButton: `px-3 py-1.5 rounded-lg bg-red-500/20 border border-red-500/30 
    text-red-400 text-sm font-medium hover:bg-red-500/30 
    focus:outline-none focus:ring-2 focus:ring-red-500/50 
    transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]`,
  
  heading: `text-4xl font-bold text-transparent bg-clip-text 
    bg-gradient-to-r from-blue-400 to-purple-400 text-center mb-6`,
  
  controlsContainer: `flex flex-wrap gap-6 mb-8`,
  
  controlGroup: `flex items-center space-x-4`,
  
  label: `text-sm font-medium text-gray-300`,
  
  input: `px-4 py-2 rounded-lg bg-gray-900/50 border border-gray-700 
    text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 
    focus:ring-blue-500 focus:border-transparent transition-all duration-200
    w-24`,
  
  button: `px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 
    text-white font-medium hover:from-blue-500 hover:to-purple-500 
    focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 
    focus:ring-offset-gray-900 transition-all duration-200
    transform hover:scale-[1.02] active:scale-[0.98]`,
  
  timelineWrapper: `bg-white/5 rounded-xl p-6 backdrop-blur-sm border border-white/10
    shadow-lg`
} 