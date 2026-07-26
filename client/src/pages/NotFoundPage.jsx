import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "../components/layout/Navbar";
import { RiRocketLine } from "react-icons/ri";

const NotFoundPage = () => (
  <div className="min-h-screen bg-slate-950 flex flex-col">
    <Navbar />
    <div className="flex-1 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="text-8xl font-extrabold gradient-text mb-4">404</div>
        <h1 className="text-2xl font-bold text-slate-200 mb-2">Page Not Found</h1>
        <p className="text-slate-500 mb-8">The page you're looking for doesn't exist or has been moved.</p>
        <Link to="/" className="btn-primary">
          <RiRocketLine /> Back to Home
        </Link>
      </motion.div>
    </div>
  </div>
);

export default NotFoundPage;
