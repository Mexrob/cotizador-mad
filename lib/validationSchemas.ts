import { z } from 'zod';
import { UserRole, UserStatus } from '@prisma/client';

export const createUserSchema = z.object({
  name: z.string().min(1, 'El nombre completo es requerido').max(255),
  email: z.string().email('Email inválido').min(1, 'El email es requerido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres').max(255),
  phone: z.string().min(1, 'El teléfono 1 es requerido').max(20),
  phone2: z.string().max(20).optional(),
  companyName: z.string().min(1, 'La razón social es requerida').max(255),
  taxId: z.string().min(1, 'El RFC es requerido').max(50),
  fiscalRegime: z.string().max(100).optional(),
  cfdiUse: z.string().max(100).optional(),
  country: z.string().max(100).default('Mexico'),
  role: z.nativeEnum(UserRole).default(UserRole.RETAIL),
  status: z.nativeEnum(UserStatus).default(UserStatus.PENDING),
  discountRate: z.number().min(0).max(100).default(0),
  creditLimit: z.number().min(0).default(0),
  deliveryAddress: z.object({
    street: z.string().min(1, 'La calle de entrega es requerida'),
    exteriorNumber: z.string().min(1, 'El número exterior de entrega es requerido'),
    interiorNumber: z.string().max(50).optional(),
    colony: z.string().min(1, 'La colonia de entrega es requerida'),
    zipCode: z.string().min(1, 'El código postal de entrega es requerido'),
    city: z.string().min(1, 'La ciudad de entrega es requerida'),
    state: z.string().min(1, 'El estado de entrega es requerido'),
  }),
  billingAddress: z.object({
    street: z.string().min(1, 'La calle fiscal es requerida'),
    number: z.string().min(1, 'El número fiscal es requerido'),
    colony: z.string().min(1, 'La colonia fiscal es requerida'),
    zipCode: z.string().min(1, 'El código postal fiscal es requerido'),
    city: z.string().min(1, 'La ciudad fiscal es requerida'),
    state: z.string().min(1, 'El estado fiscal es requerido'),
  }),
}).strict(); // strict() to disallow unknown keys

// Schema for updating users - password is optional
export const updateUserSchema = createUserSchema.extend({
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres').max(255).optional().or(z.literal('')),
});

export const productSchema = z.object({
  name: z.string({ required_error: 'El nombre es requerido' }).min(1, 'El nombre es requerido'),
  categoryId: z.string().optional(),
  
  // Información básica
  categoria: z.string().optional(),
  coleccion: z.string().optional(),
  linea: z.string().optional(),
  
  // Colores
  tonoColor: z.string().optional(),
  tonoVidrio: z.string().optional(),
  tonoAluminio: z.string().optional(),
  
  // Precio
  precioBaseM2: z.number().min(0).optional(),
  tiempoEntrega: z.number().int().min(1).optional(),
  
  // Dimensiones Puerta
  puertaAnchoMin: z.number().optional(),
  puertaAnchoMax: z.number().optional(),
  puertaAltoMin: z.number().optional(),
  puertaAltoMax: z.number().optional(),
  
  // Dimensiones Frente
  frenteAnchoMin: z.number().optional(),
  frenteAnchoMax: z.number().optional(),
  frenteAltoMin: z.number().optional(),
  frenteAltoMax: z.number().optional(),
  
  // Dimensiones Ventana
  ventanaAnchoMin: z.number().optional(),
  ventanaAnchoMax: z.number().optional(),
  ventanaAltoMin: z.number().optional(),
  ventanaAltoMax: z.number().optional(),
  
  // Precio vidrio
  precioVidrio: z.number().optional(),
  
  // Imágenes
  images: z.array(z.string()).optional(),
});

export type ProductFormData = z.infer<typeof productSchema>;

export const quoteSchema = z.object({
  customerName: z.string().min(1, 'El nombre del cliente es requerido'),
  customerEmail: z.string().email('Email del cliente inválido'),
  customerPhone: z.string().optional().or(z.literal('')),
  projectName: z.string().min(1, 'El nombre del proyecto es requerido'),
  validUntil: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
});

export type QuoteFormData = z.infer<typeof quoteSchema>;