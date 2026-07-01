import { motion } from 'framer-motion';

const getStrength = (password) => {
  let strength = 0;
  if (password.length >= 8) strength += 1;
  if (/[A-Z]/.test(password)) strength += 1;
  if (/[a-z]/.test(password)) strength += 1;
  if (/[0-9]/.test(password)) strength += 1;
  if (/[^A-Za-z0-9]/.test(password)) strength += 1;
  return strength;
};

const getStrengthDetails = (strength) => {
  switch (strength) {
    case 0:
    case 1:
    case 2:
      return { text: 'Weak', color: 'bg-red-500', width: '25%' };
    case 3:
      return { text: 'Medium', color: 'bg-yellow-500', width: '50%' };
    case 4:
      return { text: 'Strong', color: 'bg-blue-500', width: '75%' };
    case 5:
      return { text: 'Very Strong', color: 'bg-green-500', width: '100%' };
    default:
      return { text: '', color: 'bg-gray-500', width: '0%' };
  }
};

const PasswordStrengthMeter = ({ password }) => {
  if (!password) return null;

  const strength = getStrength(password);
  const { text, color, width } = getStrengthDetails(strength);

  return (
    <div className="mt-2">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs text-gray-400">Password Strength</span>
        <span className={`text-xs font-bold ${color.replace('bg-', 'text-')}`}>{text}</span>
      </div>
      <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width }}
          className={`h-full ${color}`}
          transition={{ duration: 0.3 }}
        />
      </div>
    </div>
  );
};

export default PasswordStrengthMeter;
