import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type UserRole = 'administrator' | 'technician' | 'student'

interface SignInFormData {
  email: string
  password: string
}

export function SignInPage() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState<SignInFormData>({
    email: '',
    password: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.currentTarget
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    // Clear error when user starts typing
    if (error) {
      setError(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validate form
    if (!formData.email || !formData.password) {
      setError('Please enter both email and password')
      return
    }

    setIsLoading(true)

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 800))

    // Simulate role-based redirect based on email domain
    // In a real app, this would come from your authentication API
    const simulatedRole = getSimulatedRole(formData.email)

    if (!simulatedRole) {
      setError('Invalid credentials. Please try again.')
      setIsLoading(false)
      return
    }

    // Redirect based on role
    switch (simulatedRole) {
      case 'administrator':
        navigate('/admin/dashboard')
        break
      case 'technician':
        navigate('/tech/dashboard')
        break
      case 'student':
        navigate('/portal/dashboard')
        break
      default:
        setError('Unable to determine user role')
    }

    setIsLoading(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-mist-100 px-6 py-8">
      <div className="ui-panel w-full max-w-md px-8 py-12">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-ink-950">Sign In</h1>
          <p className="mt-2 text-sm text-slate-600">
            Enter your credentials to access the print management system
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email/Username Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-ink-950 mb-2">
              Email or Username
            </label>
            <Input
              id="email"
              name="email"
              type="text"
              placeholder="name@university.edu"
              value={formData.email}
              onChange={handleInputChange}
              disabled={isLoading}
              autoComplete="email"
            />
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-ink-950 mb-2">
              Password
            </label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleInputChange}
              disabled={isLoading}
              autoComplete="current-password"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded border border-danger-200 bg-danger-50 px-4 py-3 text-sm text-danger-700">
              {error}
            </div>
          )}

          {/* Sign In Button */}
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        {/* Footer Note */}
        <p className="mt-8 text-center text-xs text-slate-500">
          Use different email domains to test roles:
          <br />
          <span className="font-mono text-slate-600">admin@</span> for Administrator,{' '}
          <span className="font-mono text-slate-600">tech@</span> for Technician,{' '}
          <span className="font-mono text-slate-600">student@</span> for Student
        </p>
      </div>
    </div>
  )
}

/**
 * Simulate role determination based on email domain prefix
 * In production, this would come from your authentication service
 */
function getSimulatedRole(email: string): UserRole | null {
  const localPart = email.split('@')[0].toLowerCase()

  if (localPart.startsWith('admin')) {
    return 'administrator'
  }
  if (localPart.startsWith('tech')) {
    return 'technician'
  }
  if (localPart.startsWith('student') || !localPart.startsWith('admin') && !localPart.startsWith('tech')) {
    return 'student'
  }

  return null
}
