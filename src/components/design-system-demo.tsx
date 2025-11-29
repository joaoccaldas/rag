/**
 * Design System Demo Component
 * Showcases all implemented design system components
 */

"use client"

import React, { useState } from 'react'
import { 
  Button, 
  Input, 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  Badge,
  Progress,
  Skeleton,
  Container,
  Grid,
  Flex,
  Stack,
  Section
} from '@/design-system'

export default function DesignSystemDemo() {
  const [inputValue, setInputValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(65)

  const handleButtonClick = () => {
    setLoading(true)
    setTimeout(() => setLoading(false), 2000)
  }

  return (
    <Container size="lg">
      <Section size="lg">
        <Stack spacing="xl">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Design System Demo</h1>
            <p className="text-lg text-muted-foreground">
              Complete implementation of modern UI/UX patterns
            </p>
          </div>

          {/* Buttons */}
          <Card>
            <CardHeader>
              <CardTitle>Button Variants</CardTitle>
            </CardHeader>
            <CardContent>
              <Flex gap="md" wrap="wrap">
                <Button variant="default">Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="destructive">Destructive</Button>
                <Button variant="link">Link</Button>
                <Button loading={loading} onClick={handleButtonClick}>
                  {loading ? 'Loading...' : 'Start Loading'}
                </Button>
              </Flex>
            </CardContent>
          </Card>

          {/* Inputs and Forms */}
          <Card>
            <CardHeader>
              <CardTitle>Form Components</CardTitle>
            </CardHeader>
            <CardContent>
              <Stack spacing="md">
                <Input 
                  placeholder="Default input"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                />
                <Input 
                  placeholder="Input with error"
                  error="This field is required"
                  variant="error"
                />
                <Input 
                  placeholder="Success input"
                  variant="success"
                />
              </Stack>
            </CardContent>
          </Card>

          {/* Badges and Status */}
          <Card>
            <CardHeader>
              <CardTitle>Badges and Status</CardTitle>
            </CardHeader>
            <CardContent>
              <Flex gap="sm" wrap="wrap">
                <Badge variant="default">Default</Badge>
                <Badge variant="secondary">Secondary</Badge>
                <Badge variant="success">Success</Badge>
                <Badge variant="warning">Warning</Badge>
                <Badge variant="destructive">Error</Badge>
                <Badge variant="info">Info</Badge>
              </Flex>
            </CardContent>
          </Card>

          {/* Progress and Loading */}
          <Card>
            <CardHeader>
              <CardTitle>Progress and Loading States</CardTitle>
            </CardHeader>
            <CardContent>
              <Stack spacing="md">
                <div>
                  <label className="text-sm font-medium mb-2 block">Progress Bar</label>
                  <Progress value={progress} showLabel />
                  <Flex gap="sm" className="mt-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setProgress(Math.max(0, progress - 10))}
                    >
                      -10%
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setProgress(Math.min(100, progress + 10))}
                    >
                      +10%
                    </Button>
                  </Flex>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Loading Skeletons</label>
                  <Stack spacing="sm">
                    <Skeleton variant="text" />
                    <Skeleton variant="rectangular" className="h-12" />
                    <Skeleton variant="circular" />
                  </Stack>
                </div>
              </Stack>
            </CardContent>
          </Card>

          {/* Layout Components */}
          <Card>
            <CardHeader>
              <CardTitle>Layout Components</CardTitle>
            </CardHeader>
            <CardContent>
              <Stack spacing="lg">
                <div>
                  <label className="text-sm font-medium mb-2 block">Grid Layout</label>
                  <Grid cols={3} gap="md">
                    <Card padding="sm" variant="outlined">
                      <p className="text-sm">Grid Item 1</p>
                    </Card>
                    <Card padding="sm" variant="outlined">
                      <p className="text-sm">Grid Item 2</p>
                    </Card>
                    <Card padding="sm" variant="outlined">
                      <p className="text-sm">Grid Item 3</p>
                    </Card>
                  </Grid>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Flex Layout</label>
                  <Flex justify="between" align="center" className="p-4 border rounded-md">
                    <span className="text-sm">Flex Start</span>
                    <Badge>Center</Badge>
                    <span className="text-sm">Flex End</span>
                  </Flex>
                </div>
              </Stack>
            </CardContent>
          </Card>

          {/* Card Variations */}
          <div>
            <h3 className="text-xl font-semibold mb-4">Card Variations</h3>
            <Grid cols={2} gap="md" responsive={{ sm: 1, lg: 3 }}>
              <Card variant="default">
                <CardContent>
                  <p className="text-sm">Default Card</p>
                </CardContent>
              </Card>
              <Card variant="outlined">
                <CardContent>
                  <p className="text-sm">Outlined Card</p>
                </CardContent>
              </Card>
              <Card variant="elevated">
                <CardContent>
                  <p className="text-sm">Elevated Card</p>
                </CardContent>
              </Card>
            </Grid>
          </div>
        </Stack>
      </Section>
    </Container>
  )
}
