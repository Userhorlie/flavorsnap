import { ReactNode, useState } from 'react';
import { useTranslation } from 'next-i18next';
import { useTheme } from './ThemeProvider'; 

interface LayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
}

const Layout = ({ children }: LayoutProps) => {
  const { t } = useTranslation('common');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const ThemeToggleButton = () => (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-md hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-accent"
      aria-label="Toggle dark mode"
    >
      {theme === 'dark' ? (
        /* Sun Icon */
        <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ) : (
        /* Moon Icon */
        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      )}
    </button>
  );

  return (
    /* Use bg-background instead of bg-gray-50 to link to our CSS variable */
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      
      {/* Mobile Header */}
      <header className="lg:hidden bg-background border-b border-muted z-50 transition-colors">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-md hover:bg-muted focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <span className="text-xl font-bold text-accent">FlavorSnap 🍛</span>
          </div>
          <ThemeToggleButton />
        </div>
      </header>

      {/* Desktop Header */}
      <header className="hidden lg:block bg-background border-b border-muted transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <span className="text-2xl font-bold text-accent">FlavorSnap 🍛</span>
              <nav className="flex space-x-4">
                <a href="/" className="text-accent font-medium px-3 py-2 text-sm">Home</a>
                <a href="/about" className="hover:text-accent px-3 py-2 text-sm font-medium transition-colors">About</a>
                <a href="/contact" className="hover:text-accent px-3 py-2 text-sm font-medium transition-colors">Contact</a>
              </nav>
            </div>
            <ThemeToggleButton />
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Main Content Area */}
        <main className="flex-1">
          {/* Ensure children also respect the background variable */}
          <div className="min-h-screen bg-background p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;