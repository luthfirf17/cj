import { Outlet } from 'react-router-dom';
import UserNavbar from '../User/UserNavbar';

const UserLayout = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <UserNavbar />

      {/* Page Content */}
      <main className="py-6 px-6 lg:px-8">
        <div className="max-w-[1400px] mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default UserLayout;
