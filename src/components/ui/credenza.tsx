import * as React from "react"

import { cn } from "@/lib/utils"
import { useIsMobile } from "@/hooks/use-mobile"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"

interface BaseProps {
  children: React.ReactNode
}

interface RootCredenzaProps extends BaseProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

interface CredenzaProps extends BaseProps {
  className?: string
  asChild?: true
}

const CredenzaContext = React.createContext<{ isMobile: boolean } | null>(null)

const useCredenzaContext = () => {
  const context = React.useContext(CredenzaContext)
  if (!context) {
    throw new Error(
      "Credenza components cannot be rendered outside the Credenza Context",
    )
  }
  return context
}

function Credenza({ children, ...props }: RootCredenzaProps) {
  const isMobile = useIsMobile()
  const Root = isMobile ? Drawer : Dialog

  return (
    <CredenzaContext.Provider value={{ isMobile }}>
      <Root {...props}>{children}</Root>
    </CredenzaContext.Provider>
  )
}

function CredenzaTrigger({ className, children, ...props }: CredenzaProps) {
  const { isMobile } = useCredenzaContext()
  const Trigger = isMobile ? DrawerTrigger : DialogTrigger

  return (
    <Trigger className={className} {...props}>
      {children}
    </Trigger>
  )
}

function CredenzaClose({ className, children, ...props }: CredenzaProps) {
  const { isMobile } = useCredenzaContext()
  const Close = isMobile ? DrawerClose : DialogClose

  return (
    <Close className={className} {...props}>
      {children}
    </Close>
  )
}

function CredenzaContent({ className, children, ...props }: CredenzaProps) {
  const { isMobile } = useCredenzaContext()
  const Content = isMobile ? DrawerContent : DialogContent

  return (
    <Content className={className} {...props}>
      {children}
    </Content>
  )
}

function CredenzaDescription({
  className,
  children,
  ...props
}: CredenzaProps) {
  const { isMobile } = useCredenzaContext()
  const Description = isMobile ? DrawerDescription : DialogDescription

  return (
    <Description className={className} {...props}>
      {children}
    </Description>
  )
}

function CredenzaHeader({ className, children, ...props }: CredenzaProps) {
  const { isMobile } = useCredenzaContext()
  const Header = isMobile ? DrawerHeader : DialogHeader

  return (
    <Header className={className} {...props}>
      {children}
    </Header>
  )
}

function CredenzaTitle({ className, children, ...props }: CredenzaProps) {
  const { isMobile } = useCredenzaContext()
  const Title = isMobile ? DrawerTitle : DialogTitle

  return (
    <Title className={className} {...props}>
      {children}
    </Title>
  )
}

function CredenzaBody({ className, children, ...props }: CredenzaProps) {
  const { isMobile } = useCredenzaContext()

  return (
    <div
      className={cn(
        "overflow-y-auto",
        isMobile && "px-4 pb-4",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

function CredenzaFooter({ className, children, ...props }: CredenzaProps) {
  const { isMobile } = useCredenzaContext()
  const Footer = isMobile ? DrawerFooter : DialogFooter

  return (
    <Footer className={className} {...props}>
      {children}
    </Footer>
  )
}

export {
  Credenza,
  CredenzaTrigger,
  CredenzaClose,
  CredenzaContent,
  CredenzaDescription,
  CredenzaHeader,
  CredenzaTitle,
  CredenzaBody,
  CredenzaFooter,
}
