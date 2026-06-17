import { motion } from 'framer-motion'
import { Navbar } from './Navbar'
import { Footer } from './Footer'
import { PageShell } from './PageShell'
import { cn } from '@/lib/utils'

interface PageWrapperProps {
  children: React.ReactNode
  className?: string
}

export function PageWrapper({ children, className }: PageWrapperProps) {
  return (
    <PageShell>
      <Navbar />
      <motion.main
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          'mx-auto flex w-full max-w-page flex-1 flex-col px-4 py-8 sm:px-8 relative z-10',
          className,
        )}
      >
        {children}
      </motion.main>
      <Footer />
    </PageShell>
  )
}
