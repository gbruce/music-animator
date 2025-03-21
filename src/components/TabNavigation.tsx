import React from 'react';
import { timelineStyles as styles } from './styles/TimelineStyles';

export type Tab = 'projects' | 'images' | 'txt2img';

interface TabNavigationProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

const TabNavigation: React.FC<TabNavigationProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className={styles.tabContainer}>
      <div
        className={`${styles.tab} ${activeTab === 'projects' ? styles.activeTab : ''}`}
        onClick={() => onTabChange('projects')}
      >
        Projects
      </div>
      <div
        className={`${styles.tab} ${activeTab === 'images' ? styles.activeTab : ''}`}
        onClick={() => onTabChange('images')}
      >
        Images
      </div>
      <div
        className={`${styles.tab} ${activeTab === 'txt2img' ? styles.activeTab : ''}`}
        onClick={() => onTabChange('txt2img')}
      >
        Txt2Img
      </div>
    </div>
  );
};

export default TabNavigation; 