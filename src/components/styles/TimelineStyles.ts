export const timelineStyles = {
  container: `min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 
    flex flex-col p-4 relative overflow-hidden`,
  
  glowEffect: `before:content-[''] before:absolute before:w-96 before:h-96 
    before:bg-purple-600 before:rounded-full before:blur-3xl before:opacity-20 before:-z-10 before:animate-pulse
    after:content-[''] after:absolute after:w-96 after:h-96 
    after:bg-blue-600 after:rounded-full after:blur-3xl after:opacity-20 after:-z-10
    after:animate-pulse after:animation-delay-2000`,
  
  contentContainer: `w-full`,
  
  topBar: `flex justify-between items-center w-full mb-6`,
  
  projectSelectorContainer: `flex items-center gap-4`,
  
  userInfoContainer: `flex items-center gap-4`,
  
  username: `text-gray-300 font-medium`,
  
  logoutButton: `px-3 py-1.5 rounded-lg bg-red-500/20 border border-red-500/30 
    text-red-400 text-sm font-medium hover:bg-red-500/30 
    focus:outline-none focus:ring-2 focus:ring-red-500/50 
    transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]`,
  
  heading: `text-4xl font-bold text-transparent bg-clip-text 
    bg-gradient-to-r from-blue-400 to-purple-400 text-center mb-6`,
  
  projectSelector: `flex justify-center mb-6`,
  
  projectDropdown: `px-4 py-2 rounded-lg bg-gray-900/50 border border-gray-700 
    text-gray-100 focus:outline-none focus:ring-2 
    focus:ring-blue-500 focus:border-transparent transition-all duration-200
    w-64`,
  
  newProjectForm: `flex justify-center mb-6`,
  
  createButton: `px-4 py-2 ml-2 rounded-lg bg-gradient-to-r from-green-600 to-teal-600 
    text-white font-medium hover:from-green-500 hover:to-teal-500 
    focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 
    focus:ring-offset-gray-900 transition-all duration-200
    transform hover:scale-[1.02] active:scale-[0.98]`,
  
  cancelButton: `px-4 py-2 ml-2 rounded-lg bg-gray-700/50 border border-gray-600 
    text-gray-300 font-medium hover:bg-gray-700 
    focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 
    focus:ring-offset-gray-900 transition-all duration-200
    transform hover:scale-[1.02] active:scale-[0.98]`,
  
  loadingContainer: `flex justify-center items-center min-h-screen 
    text-xl font-medium text-blue-300`,
  
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
    shadow-lg`,
    
  // Track list styles
  trackListContainer: `bg-white/5 rounded-xl p-6 backdrop-blur-sm border border-white/10
    shadow-lg mb-6`,
    
  trackListHeader: `flex justify-between items-center mb-4`,
  
  trackListTitle: `text-xl font-bold text-transparent bg-clip-text 
    bg-gradient-to-r from-blue-400 to-purple-400`,
  
  addTrackButton: `px-3 py-1.5 rounded-lg bg-blue-500/20 border border-blue-500/30 
    text-blue-400 text-sm font-medium hover:bg-blue-500/30 
    focus:outline-none focus:ring-2 focus:ring-blue-500/50 
    transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]`,
  
  trackForm: `bg-gray-800/50 rounded-lg p-4 mb-4 border border-gray-700/50`,
  
  formGroup: `mb-3`,
  
  formActions: `flex justify-end mt-4`,
  
  trackList: `space-y-2`,
  
  trackItem: `bg-gray-800/50 rounded-lg p-3 flex justify-between items-center 
    border border-gray-700/50 hover:bg-gray-700/50 cursor-pointer transition-colors`,
  
  selectedTrack: `bg-blue-900/30 border-blue-500/50 hover:bg-blue-800/50`,
  
  trackInfo: `flex-1`,
  
  trackName: `text-gray-200 font-medium`,
  
  trackDetails: `text-gray-400 text-sm mt-1`,
  
  trackActions: `flex space-x-2`,
  
  editButton: `px-2 py-1 rounded bg-gray-700/50 text-gray-300 text-xs 
    hover:bg-gray-600/50 transition-colors`,
  
  deleteButton: `px-2 py-1 rounded bg-red-900/30 text-red-300 text-xs 
    hover:bg-red-800/50 transition-colors`,
    
  noTracks: `text-center text-gray-400 py-4`,
  
  // Image manager styles
  dropZone: `w-full h-40 border-2 border-dashed border-blue-400/50 rounded-lg 
    flex items-center justify-center cursor-pointer transition-all duration-200
    hover:border-blue-400 hover:bg-blue-400/10 mb-6`,
  
  dropZoneActive: `border-blue-500 bg-blue-500/20`,
  
  dropZoneContent: `flex flex-col items-center justify-center text-gray-300`,
  
  uploadIcon: `w-10 h-10 mb-2 text-blue-400`,
  
  errorMessage: `text-red-400 mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg`,
  
  imageGrid: `grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 
    max-h-[calc(100vh-300px)] overflow-y-auto p-2`,
  
  noImages: `col-span-full text-center text-gray-400 py-8`,
  
  imageCard: `relative bg-gray-800 rounded-lg overflow-hidden border border-gray-700 
    transition-all duration-200 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10`,
  
  imagePreview: `w-full aspect-square object-cover`,
  
  imageInfo: `p-3`,
  
  imageName: `text-gray-200 font-medium truncate`,
  
  imageDetails: `text-gray-400 text-sm`,
  
  imageSeparator: `mx-1`,
  
  imageDeleteButton: `absolute top-2 right-2 w-8 h-8 rounded-full bg-gray-900/80 
    flex items-center justify-center text-gray-400 hover:text-red-400 
    transition-all duration-200 hover:bg-gray-900`,
  
  // Folder tree styles
  imageContent: `flex`,
  
  folderTreeContainer: `w-64 border-r border-gray-700 mr-4 overflow-y-auto max-h-[calc(100vh-300px)]`,
  
  folderTree: `py-2`,
  
  folderItem: `flex items-center py-1 px-2 text-gray-300 hover:bg-gray-700/50 cursor-pointer
    transition-colors rounded-md mb-1 group`,
    
  folderItemSelected: `bg-blue-500/20 text-blue-400`,
  
  folderName: `ml-2 text-sm truncate flex-grow`,
  
  folderIcon: `text-gray-400 transition-colors`,
  
  folderActions: `opacity-0 group-hover:opacity-100 flex space-x-1`,
  
  folderActionButton: `text-gray-400 hover:text-gray-200 p-1`,
  
  folderActionButtonDanger: `text-gray-400 hover:text-red-400 p-1`,
  
  addFolderButton: `flex items-center justify-center text-sm text-gray-400 py-2 px-3 
    hover:bg-gray-700/50 hover:text-gray-200 transition-colors rounded-md w-full mt-1`,
  
  folderChildren: `ml-4 pl-2 border-l border-gray-700 mt-1`,
  
  draggingOver: `bg-blue-500/20 border border-blue-500/50`,
  
  contentPanel: `flex-1 overflow-hidden`,
  
  breadcrumbs: `flex items-center text-sm text-gray-400 mb-4 flex-wrap`,
  
  breadcrumbsSeparator: `mx-2 text-gray-600`,
  
  breadcrumbLink: `hover:text-blue-400 cursor-pointer`,
  
  breadcrumbCurrent: `text-gray-200`,
  
  folderIndicator: `text-gray-400 text-sm mb-2`,
  
  // Modal styles
  modal: `fixed inset-0 flex items-center justify-center z-50 bg-black/70`,
  
  modalContent: `bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4`,
  
  modalHeader: `text-lg font-medium text-gray-200 mb-4`,
  
  modalForm: `space-y-4`,
  
  modalLabel: `block text-sm font-medium text-gray-300 mb-1`,
  
  modalInput: `w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-gray-200
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`,
  
  modalActions: `flex justify-end space-x-3 mt-6`,
  
  modalCancel: `px-4 py-2 bg-gray-700 text-gray-200 rounded-md hover:bg-gray-600 transition-colors`,
  
  modalSubmit: `px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500 transition-colors`,
  
  // Tab navigation styles
  tabContainer: `flex mb-6 border-b border-gray-700`,
  
  tab: `px-4 py-2 text-gray-400 hover:text-gray-200 cursor-pointer`,
  
  activeTab: `text-blue-400 border-b-2 border-blue-400`,
  
  // Tab content style
  tabContent: `w-full`,
} 