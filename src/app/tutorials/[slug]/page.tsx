import fs from "fs"
import path from "path"
import { notFound } from "next/navigation"
import Link from "next/link"
import { MDXRemote } from "next-mdx-remote/rsc"
import matter from "gray-matter"
import AffiliateLink from "@/components/AffiliateLink"

// Define custom MDX components we want to allow in tutorials
const mdxComponents = {
  // Override links to go through our AffiliateLink component!
  a: ({ href, children, title }: any) => {
    const normalized = href ? href.toLowerCase().replace(/[\s.-]/g, "") : ""
    const providerKeys = [
      "runpod", "vastai", "digitalocean", "lambda", "lambdalabs", 
      "tensordock", "kaggle", "colab", "googlecolab", "lightning", 
      "lightningai", "huggingface"
    ]
    const isProvider = providerKeys.includes(normalized)

    return (
      <AffiliateLink 
        provider={isProvider ? href : undefined} 
        href={isProvider ? undefined : href} 
        className="text-blue-600 hover:text-blue-800 underline font-semibold"
      >
        {children}
      </AffiliateLink>
    )
  },
  // We can add other custom elements (like warning callouts or custom buttons) here
}

type Props = {
  params: {
    slug: string
  }
}

// Generate static params for static site generation (optional, but great for Vercel caching!)
export async function generateStaticParams() {
  const contentDir = path.join(process.cwd(), "content/tutorials")
  if (!fs.existsSync(contentDir)) return []

  const files = fs.readdirSync(contentDir)
  return files
    .filter((file) => file.endsWith(".mdx"))
    .map((file) => ({
      slug: file.replace(".mdx", ""),
    }))
}

export default async function TutorialPage({ params }: Props) {
  const { slug } = params
  const contentDir = path.join(process.cwd(), "content/tutorials")
  const filePath = path.join(contentDir, `${slug}.mdx`)

  // Return 404 if file does not exist
  if (!fs.existsSync(filePath)) {
    notFound()
  }

  // Read MDX file and parse frontmatter
  const fileContent = fs.readFileSync(filePath, "utf8")
  const { data: frontmatter, content } = matter(fileContent)

  return (
    <main className="min-h-screen bg-gray-50 py-12">
      <article className="max-w-4xl mx-auto px-4">
        {/* Back Link */}
        <div className="mb-6">
          <Link
            href="/tutorials"
            className="inline-flex items-center text-sm font-semibold text-gray-500 hover:text-blue-600 transition"
          >
            ← Back to Tutorials
          </Link>
        </div>

        {/* Tutorial Header Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8 mb-8">
          <div className="flex flex-wrap gap-2 mb-4">
            {frontmatter.category && (
              <span className="bg-blue-50 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider">
                {frontmatter.category}
              </span>
            )}
            {frontmatter.readTime && (
              <span className="bg-gray-100 text-gray-600 text-xs font-semibold px-2.5 py-1 rounded-full">
                ⏱️ {frontmatter.readTime}
              </span>
            )}
          </div>

          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight">
            {frontmatter.title}
          </h1>

          <p className="mt-4 text-lg text-gray-500 leading-relaxed">
            {frontmatter.description}
          </p>

          <div className="mt-6 flex items-center space-x-3 text-sm text-gray-400 border-t border-gray-100 pt-6">
            <span>By <strong className="text-gray-700 font-semibold">{frontmatter.author ?? "GPU Compare Staff"}</strong></span>
            <span>•</span>
            <span>Published {frontmatter.date}</span>
          </div>
        </div>

        {/* Main Article Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-10">
          <div className="prose prose-blue max-w-none prose-headings:font-bold prose-a:text-blue-600 prose-pre:bg-gray-950 prose-pre:text-gray-100">
            <MDXRemote source={content} components={mdxComponents} />
          </div>
        </div>
      </article>
    </main>
  )
}
