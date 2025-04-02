import Image from 'next/image'
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "./ui/dialog"
import { YouTube } from '@/data/youtube'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'

export const YouTubeDialog = ({ video }: { video: YouTube }) => {
  return (
    <Dialog>

      <DialogTrigger asChild>
        <div className="relative overflow-hidden rounded-lg cursor-pointer group">
          <div className="relative aspect-video">
            <Image
              src={`https://img.youtube.com/vi/${video.id}/maxresdefault.jpg`}
              alt={video.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105 rounded-lg"
            />
          </div>
          <div className="p-2">
            <h3 className="text-lg font-medium line-clamp-1">{video.title}</h3>
          </div>
        </div>
      </DialogTrigger>

      <DialogContent className="min-w-screen md:min-w-[90vw] p-0 md:p-4 border-black bg-black md:bg-white md:border-white overflow-hidden">
        <VisuallyHidden>
          <DialogTitle></DialogTitle>
        </VisuallyHidden>
        <div className="w-full aspect-video md:p-5">
          <iframe
            width="100%"
            height="100%"
            className="border-0 rounded-lg"
            src={`https://www.youtube.com/embed/${video.id}?autoplay=1`}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          ></iframe>
        </div>
      </DialogContent>

    </Dialog>
  )
}