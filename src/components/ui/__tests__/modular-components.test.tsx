/**
 * Modular Components Tests
 * 
 * Test suite for the modular component architecture
 */

import React from 'react'
import { 
  Container, 
  Card, 
  Button, 
  Tabs, 
  LoadingSkeleton, 
  ErrorFallback 
} from '../components/ui/modular-components'
import { 
  renderWithProviders, 
  expectToBeInDocument, 
  expectToHaveClass,
  expectToHaveTextContent,
  userEvent 
} from '../test/test-utils'

describe('Modular Components', () => {
  describe('Container', () => {
    it('renders children correctly', () => {
      const { getByText } = renderWithProviders(
        <Container>
          <p>Test content</p>
        </Container>
      )
      
      expectToBeInDocument(getByText('Test content'))
    })

    it('applies correct max-width classes', () => {
      const { container } = renderWithProviders(
        <Container maxWidth="lg" data-testid="container">
          Content
        </Container>
      )
      
      const containerElement = container.querySelector('[data-testid="container"]')
      expectToHaveClass(containerElement, 'max-w-lg')
    })

    it('applies padding classes correctly', () => {
      const { container } = renderWithProviders(
        <Container padding="lg" data-testid="container">
          Content
        </Container>
      )
      
      const containerElement = container.querySelector('[data-testid="container"]')
      expectToHaveClass(containerElement, 'p-6')
    })

    it('centers content when centered prop is true', () => {
      const { container } = renderWithProviders(
        <Container centered data-testid="container">
          Content
        </Container>
      )
      
      const containerElement = container.querySelector('[data-testid="container"]')
      expectToHaveClass(containerElement, 'mx-auto')
    })
  })

  describe('Card', () => {
    it('renders basic card with content', () => {
      const { getByText } = renderWithProviders(
        <Card>
          <p>Card content</p>
        </Card>
      )
      
      expectToBeInDocument(getByText('Card content'))
    })

    it('renders title and subtitle', () => {
      const { getByText } = renderWithProviders(
        <Card title="Test Title" subtitle="Test Subtitle">
          Content
        </Card>
      )
      
      expectToBeInDocument(getByText('Test Title'))
      expectToBeInDocument(getByText('Test Subtitle'))
    })

    it('renders loading state', () => {
      const { container } = renderWithProviders(
        <Card loading>
          Content
        </Card>
      )
      
      const loadingElement = container.querySelector('.animate-pulse')
      expectToBeInDocument(loadingElement)
    })

    it('renders error state', () => {
      const { getByText } = renderWithProviders(
        <Card error="Test error message">
          Content
        </Card>
      )
      
      expectToBeInDocument(getByText('Error'))
      expectToBeInDocument(getByText('Test error message'))
    })

    it('applies variant classes correctly', () => {
      const { container } = renderWithProviders(
        <Card variant="elevated" data-testid="card">
          Content
        </Card>
      )
      
      const cardElement = container.querySelector('[data-testid="card"]')
      expectToHaveClass(cardElement, 'shadow-lg')
    })
  })

  describe('Button', () => {
    it('renders button with text', () => {
      const { getByRole } = renderWithProviders(
        <Button>Click me</Button>
      )
      
      const button = getByRole('button')
      expectToBeInDocument(button)
      expectToHaveTextContent(button, 'Click me')
    })

    it('calls onClick when clicked', async () => {
      const handleClick = jest.fn()
      const { getByRole } = renderWithProviders(
        <Button onClick={handleClick}>Click me</Button>
      )
      
      const button = getByRole('button')
      await userEvent.click(button)
      
      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('applies variant classes correctly', () => {
      const { getByRole } = renderWithProviders(
        <Button variant="danger">Delete</Button>
      )
      
      const button = getByRole('button')
      expectToHaveClass(button, 'bg-red-600')
    })

    it('shows loading state', () => {
      const { getByText } = renderWithProviders(
        <Button loading>Loading button</Button>
      )
      
      expectToBeInDocument(getByText('Loading...'))
    })

    it('is disabled when disabled prop is true', () => {
      const { getByRole } = renderWithProviders(
        <Button disabled>Disabled button</Button>
      )
      
      const button = getByRole('button')
      expect(button).toBeDisabled()
    })

    it('renders icon correctly', () => {
      const { container } = renderWithProviders(
        <Button icon={<span data-testid="icon">🔍</span>}>
          Search
        </Button>
      )
      
      const icon = container.querySelector('[data-testid="icon"]')
      expectToBeInDocument(icon)
    })
  })

  describe('Tabs', () => {
    const mockTabs = [
      { id: 'tab1', label: 'Tab 1' },
      { id: 'tab2', label: 'Tab 2' },
      { id: 'tab3', label: 'Tab 3', disabled: true },
    ]

    it('renders all tabs', () => {
      const { getByText } = renderWithProviders(
        <Tabs 
          tabs={mockTabs} 
          activeTab="tab1" 
          onTabChange={jest.fn()} 
        />
      )
      
      expectToBeInDocument(getByText('Tab 1'))
      expectToBeInDocument(getByText('Tab 2'))
      expectToBeInDocument(getByText('Tab 3'))
    })

    it('calls onTabChange when tab is clicked', async () => {
      const handleTabChange = jest.fn()
      const { getByText } = renderWithProviders(
        <Tabs 
          tabs={mockTabs} 
          activeTab="tab1" 
          onTabChange={handleTabChange} 
        />
      )
      
      const tab2 = getByText('Tab 2')
      await userEvent.click(tab2)
      
      expect(handleTabChange).toHaveBeenCalledWith('tab2')
    })

    it('does not call onTabChange for disabled tabs', async () => {
      const handleTabChange = jest.fn()
      const { getByText } = renderWithProviders(
        <Tabs 
          tabs={mockTabs} 
          activeTab="tab1" 
          onTabChange={handleTabChange} 
        />
      )
      
      const disabledTab = getByText('Tab 3')
      await userEvent.click(disabledTab)
      
      expect(handleTabChange).not.toHaveBeenCalled()
    })

    it('applies active styles to active tab', () => {
      const { getByText } = renderWithProviders(
        <Tabs 
          tabs={mockTabs} 
          activeTab="tab1" 
          onTabChange={jest.fn()} 
        />
      )
      
      const activeTab = getByText('Tab 1')
      expectToHaveClass(activeTab, 'border-blue-500')
    })

    it('renders badges correctly', () => {
      const tabsWithBadge = [
        { id: 'tab1', label: 'Tab 1', badge: '5' },
      ]
      
      const { getByText } = renderWithProviders(
        <Tabs 
          tabs={tabsWithBadge} 
          activeTab="tab1" 
          onTabChange={jest.fn()} 
        />
      )
      
      expectToBeInDocument(getByText('5'))
    })
  })

  describe('LoadingSkeleton', () => {
    it('renders correct number of skeleton lines', () => {
      const { container } = renderWithProviders(
        <LoadingSkeleton lines={5} />
      )
      
      const skeletonLines = container.querySelectorAll('.h-4')
      expect(skeletonLines).toHaveLength(5)
    })

    it('applies animate-pulse class', () => {
      const { container } = renderWithProviders(
        <LoadingSkeleton />
      )
      
      const skeleton = container.querySelector('.animate-pulse')
      expectToBeInDocument(skeleton)
    })
  })

  describe('ErrorFallback', () => {
    const mockError = new Error('Test error message')
    const mockResetError = jest.fn()

    it('displays error message', () => {
      const { getByText } = renderWithProviders(
        <ErrorFallback error={mockError} resetError={mockResetError} />
      )
      
      expectToBeInDocument(getByText('Something went wrong'))
      expectToBeInDocument(getByText('Test error message'))
    })

    it('calls resetError when try again button is clicked', async () => {
      const { getByText } = renderWithProviders(
        <ErrorFallback error={mockError} resetError={mockResetError} />
      )
      
      const tryAgainButton = getByText('Try again')
      await userEvent.click(tryAgainButton)
      
      expect(mockResetError).toHaveBeenCalledTimes(1)
    })
  })
})
