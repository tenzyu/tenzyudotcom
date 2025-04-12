import { Card, CardContent, CardTitle } from '@/components/shadcn-ui/card'
import { ArrowLeft, ArrowRight } from 'lucide-react'

export function KeyboardSettings() {
  return (
    <Card className='h-full'>
      <CardContent className='px-6 py-4'>
        <CardTitle className='pb-4 text-lg'>Keyboard</CardTitle>
        <div className='flex flex-col md:flex-row gap-6'>
          {/* Visualization - Left side */}
          <div className='md:w-1/2'>
            {/* SayoDevice O3C keyboard visualization */}
            <div className='relative bg-gray-100 dark:bg-[#2d3642] rounded-md p-4 max-w-[400px] mx-auto aspect-[4/3]'>
              {/* Knob */}
              <div className='absolute top-[4%] left-[3%] w-34 h-34 rounded-full bg-gray-200 dark:bg-[#252c38] flex items-center justify-center'>
                <div className='w-20 h-20 rounded-full bg-gray-300 dark:bg-[#1e2530] relative flex items-center justify-center'>
                  {/* Knob center */}
                  <div className='dark:text-gray-300 text-lg font-medium'>
                    Y
                  </div>

                  {/* Rotation indicators */}
                  <div className='absolute -left-5 top-1/2 transform -translate-y-1/2 text-gray-400'>
                    <ArrowLeft className='h-4 w-4' />
                  </div>
                  <div className='absolute -right-5 top-1/2 transform -translate-y-1/2 text-gray-400'>
                    <ArrowRight className='h-4 w-4' />
                  </div>
                </div>
              </div>

              {/* Keys */}
              <div className='absolute bottom-[5%] left-0 right-0 flex justify-center gap-2'>
                <div className='w-29 h-29 bg-gray-300 dark:bg-[#252c38] rounded-md flex items-center justify-center'>
                  <span className='text-lg font-medium dark:text-gray-300'>
                    C
                  </span>
                </div>
                <div className='w-29 h-29 bg-gray-300 dark:bg-[#252c38] rounded-md flex items-center justify-center'>
                  <span className='text-lg font-medium dark:text-gray-300'>
                    Z
                  </span>
                </div>
                <div className='w-29 h-29 bg-gray-300 dark:bg-[#252c38] rounded-md flex items-center justify-center'>
                  <span className='text-lg font-medium dark:text-gray-300'>
                    X
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Data - Right side */}
          <div className='md:w-1/2'>
            <div className='space-y-4'>
              <div>
                <div className='font-medium mb-1'>Name:</div>
                <div className='text-lg'>SayoDevice O3C v1 (QwQ)</div>
              </div>

              <div>
                <div className='font-medium mb-1'>Key Mapping:</div>
                <div className='grid grid-cols-3 gap-2'>
                  <div>
                    <span>Left Key:</span>
                    <span className='font-medium ml-2'>C</span>
                  </div>
                  <div>
                    <span>Middle Key:</span>
                    <span className='font-medium ml-2'>Z</span>
                  </div>
                  <div>
                    <span>Right Key:</span>
                    <span className='font-medium ml-2'>X</span>
                  </div>
                </div>
              </div>

              <div>
                <div className='font-medium mb-1'>Knob Functions:</div>
                <div className='grid grid-cols-3 gap-2'>
                  <div>
                    <span>Press:</span>
                    <span className='font-medium ml-2'>Y</span>
                  </div>
                  <div>
                    <span>Left Rotation:</span>
                    <span className='font-medium ml-2'>←</span>
                  </div>
                  <div>
                    <span>Right Rotation:</span>
                    <span className='font-medium ml-2'>→</span>
                  </div>
                </div>
              </div>

              <div className='mt-3 text-sm text-gray-600 dark:text-gray-400'>
                <div className='flex items-center gap-1'>
                  <div className='w-3 h-3 bg-green-500 rounded-full' />
                  <span>Actuation: 0.15mm</span>
                </div>
                <div className='flex items-center gap-1 mt-1'>
                  <div className='w-3 h-3 bg-blue-500 rounded-full' />
                  <span>RT trigger: 0.20mm</span>
                </div>
                <div className='flex items-center gap-1 mt-1'>
                  <div className='w-3 h-3 bg-red-500 rounded-full' />
                  <span>RT release: 0.20mm</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
