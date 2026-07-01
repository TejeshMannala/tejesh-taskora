import { z } from 'zod';

export const signupSchema = z.object({
  fullName: z
    .string()
    .min(3, 'Name must be at least 3 characters')
    .max(50, 'Name must be less than 50 characters')
    .regex(/^[A-Za-z ]+$/, 'Only letters and spaces are allowed'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(20, 'Password must be less than 20 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,20}$/,
      'Must contain uppercase, lowercase, number, and special character'
    ),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
  college: z.string().min(1, 'College name is required'),
  educationType: z.string().min(1, 'Please select an education type'),
  group: z.string().min(1, 'Please select a group'),
  academicYear: z.string().min(1, 'Please select your academic year'),
}).superRefine((data, ctx) => {
  if (data.password !== data.confirmPassword) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Passwords do not match',
      path: ['confirmPassword'],
    });
  }
});

export const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});
