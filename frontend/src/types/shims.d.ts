declare module "class-variance-authority" {
  export type VariantProps<T> = any;
  export function cva(...args: any[]): any;
}

declare module "cmdk" {
  export const Command: any;
}

declare module "input-otp" {
  export const OTPInput: any;
  export const OTPInputContext: any;
}

declare module "@radix-ui/react-tooltip" {
  export const Provider: any;
  export const Root: any;
  export const Trigger: any;
  export const Content: any;
}

declare module "next-themes" {
  export function useTheme(): { theme?: string; setTheme: (theme: string) => void };
}