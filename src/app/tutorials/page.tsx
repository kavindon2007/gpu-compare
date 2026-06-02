import fs from "fs"
import path from "path"
import Link from "next/link"
import matter from "gray-matter"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "ML GPU Training Tutorials & Guides | GPU Compare",
  description: "Learn how to train deep learning models on remote GPUs. Step-by-step developer guides for Kaggle, Google Colab, RunPod, and other GPU clouds.",
}

type TutorialItem = {
  slug: string
  title: string
  description: string
  date: string
  readTime: string
  category: string
  tags: string[]
}

export default async function TutorialsListPage() {
  const contentDir = path.join(process.cwd(), "content/tutorials")
  let tutorials: TutorialItem[] = []

  if (fs.existsSync(contentDir)) {
    const files = fs.readdirSync(contentDir)
    tutorials = files
      .filter((file) => file.endsWith(".mdx"))
      .map((file) => {
        const filePath = path.join(contentDir, file)
        const fileContent = fs.readFileSync(filePath, "utf8")
        const { data: frontmatter } = matter(fileContent)

        return {
          slug: file.replace(".mdx", ""),
          title: frontmatter.title ?? "Untitled Tutorial",
          description: frontmatter.description ?? "",
          date: frontmatter.date ?? "Unknown Date",
          readTime: frontmatter.readTime ?? "5 min read",
          category: frontmatter.category ?? "Guides",
          tags: frontmatter.tags ?? [],
        }
      })
      // Sort by date descending (newest first)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }

  return (
    <main className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4">
        {/* Page Header */}
        <div className="mb-10 text-center sm:text-left">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight sm:text-4xl">
            ML Training Tutorials & Guides
          </h1>
          <p className="mt-2 text-base text-gray-500 max-w-2xl">
            Step-by-step guides on training deep learning models, comparing hardware, and setting up remote GPU environments.
          </p>
        </div>

        {/* Listings Grid */}
        {tutorials.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500">
            No tutorials published yet. Check back soon!
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {tutorials.map((tutorial) => (
              <Link
                key={tutorial.slug}
                href={`/tutorials/${tutorial.slug}`}
                className="group bg-white rounded-xl border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all duration-200 flex flex-col h-full overflow-hidden"
              >
                {/* Visual Accent */}
                <div className="h-2 bg-gradient-to-r from-blue-500 to-indigo-600" />

                <div className="p-6 flex flex-col flex-grow">
                  {/* Category and Read time */}
                  <div className="flex items-center justify-between text-xs font-semibold text-gray-400 mb-3">
                    <span className="text-blue-600 uppercase tracking-wider">
                      {tutorial.category}
                    </span>
                    <span>{tutorial.readTime}</span>
                  </div>

                  {/* Title */}
                  <h2 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-150 mb-2 line-clamp-2">
                    {tutorial.title}
                  </h2>

                  {/* Description */}
                  <p className="text-sm text-gray-500 leading-relaxed mb-6 line-clamp-3 flex-grow">
                    {tutorial.description}
                  </p>

                  {/* Date and CTA */}
                  <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
                    <span>{tutorial.date}</span>
                    <span className="font-bold text-blue-600 group-hover:translate-x-1 transition-transform duration-150 inline-block">
                      Read Guide →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
