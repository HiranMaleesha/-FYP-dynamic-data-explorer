'use client'
import UploaderBox from './modules/landing-page/uploader-box';
export default function Home() {
  return (
<div
      className="flex flex-col overflow-hidden bg-white pb-8 min-h-dvh md:min-h-[min(100dvh,1000px)] md:pb-0"
    >
      <div className="relative isolate flex flex-grow px-6 lg:px-8">
        <div className="mx-auto">
          <div className="text-center">
            <h1 className="text-h3 sm:text-h2 md:text-h1 text-secondary-700 mt-36 leading-tight font-semibold tracking-normal break-words hyphens-auto">
              Dynamic Data Explorer
            </h1>

            <p className="text-secondary-500 mt-2 md:max-w-3xl md:text-xl">
              add your data, and get insights instantly, ask questions, get answers
            </p>
            <UploaderBox />
          </div>
        </div>
      </div>
    </div>
  );
}
