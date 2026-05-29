import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner> & {
  richColors?: boolean;
};

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      position="top-right"
      closeButton
      richColors
      toastOptions={{
        closeButton: true,
        classNames: {
          toast: "group toast group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
