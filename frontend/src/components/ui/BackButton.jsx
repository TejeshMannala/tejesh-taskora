import { motion } from 'framer-motion';
import { FaArrowLeft } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const BackButton = ({
  to = '/',
  label = 'Back',
  className = 'inline-flex items-center',
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ x: -3 }}
      whileTap={{ scale: 0.97 }}
    >
      <Link
        to={to}
        className={`bg-white/5 border border-white/10 backdrop-blur rounded-xl px-4 py-2.5 flex items-center gap-2 text-sm text-gray-300 ${className}`}
      >
        <FaArrowLeft size={12} />
        {label}
      </Link>
    </motion.div>
  );
};

export default BackButton;
