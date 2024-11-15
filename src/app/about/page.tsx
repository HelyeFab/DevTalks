import { Metadata } from 'next'
import Image from 'next/image'

export const metadata: Metadata = {
  title: 'About - Emmanuel Fabiani',
  description: 'Software engineer, writer, and creator.',
}

export default function AboutPage() {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-8 row-start-2 items-center">
        <div className="relative w-48 h-48">
          <Image
            src="/profile.jpg"
            alt="Emmanuel Fabiani"
            fill
            className="rounded-full object-cover"
            priority
          />
        </div>

        <h1 className="text-4xl font-bold text-center">Emmanuel Fabiani</h1>
        <h2 className="text-xl text-gray-600 dark:text-gray-400 text-center">
          Software Engineer & Writer Beano
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
          {/* About Card */}
          <a
            href="#about"
            className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
          >
            <h2 className="mb-3 text-2xl font-semibold">
              About{' '}
              <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
                -&gt;
              </span>
            </h2>
            <p className="m-0 max-w-[30ch] text-sm opacity-50">
              I'm Beano, a software engineer based in Paris, France. I specialize in building
              modern web applications with a focus on user experience and performance.
            </p>
          </a>

          {/* Experience Card */}
          <a
            href="#experience"
            className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
          >
            <h2 className="mb-3 text-2xl font-semibold">
              Experience{' '}
              <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
                -&gt;
              </span>
            </h2>
            <p className="m-0 max-w-[30ch] text-sm opacity-50">
              Senior Software Engineer with expertise in Next.js, React, and TypeScript.
              Previously worked on various full-stack applications.
            </p>
          </a>

          {/* Contact Card */}
          <a
            href="#contact"
            className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
          >
            <h2 className="mb-3 text-2xl font-semibold">
              Contact{' '}
              <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
                -&gt;
              </span>
            </h2>
            <p className="m-0 max-w-[30ch] text-sm opacity-50">
              Feel free to reach out if you'd like to collaborate on a project or just want to connect.
            </p>
          </a>
        </div>

        {/* Content Sections */}
        <div className="mt-16 space-y-16 w-full max-w-4xl">
          <section id="about" className="space-y-8">
            <h2 className="text-3xl font-bold">About</h2>
            <div className="prose dark:prose-invert">
              <p>
                I'm Emmanuel, a software engineer based in Paris, France. I specialize in building
                modern web applications with a focus on user experience and performance.
              </p>
              <p>
                With a passion for clean code and innovative solutions, I enjoy tackling complex
                problems and creating seamless digital experiences.
              </p>
            </div>
          </section>

          <section id="experience" className="space-y-8">
            <h2 className="text-3xl font-bold">Experience</h2>
            <div className="space-y-8">
              <div className="space-y-4">
                <h3 className="text-xl font-semibold">Senior Software Engineer</h3>
                <p className="text-gray-600 dark:text-gray-400">Current Company • 2021 - Present</p>
                <p>
                  Leading development of modern web applications using Next.js, React, and TypeScript.
                </p>
              </div>
              <div className="space-y-4">
                <h3 className="text-xl font-semibold">Software Engineer</h3>
                <p className="text-gray-600 dark:text-gray-400">Previous Company • 2019 - 2021</p>
                <p>
                  Developed and maintained full-stack applications using Node.js and React.
                </p>
              </div>
            </div>
          </section>

          <section id="contact" className="space-y-8">
            <h2 className="text-3xl font-bold">Contact</h2>
            <div className="space-y-4">
              <p>
                Feel free to reach out if you'd like to collaborate on a project or just want to connect.
              </p>
              <div className="flex flex-col space-y-2">
                <a
                  href="mailto:emmanuelfabiani23@gmail.com"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  emmanuelfabiani23@gmail.com
                </a>
                <div className="flex space-x-4">
                  <a
                    href="https://github.com/yourusername"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                  >
                    GitHub
                  </a>
                  <a
                    href="https://linkedin.com/in/yourusername"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                  >
                    LinkedIn
                  </a>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}