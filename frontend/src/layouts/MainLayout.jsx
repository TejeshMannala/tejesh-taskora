import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

const MainLayout = () => {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <Navbar />
      <main className="pt-20 pb-10 px-4 md:px-8 lg:ml-60 transition-all duration-300">
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
