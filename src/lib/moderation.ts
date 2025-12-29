import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function moderateContent(content: string) {
  try {
    const moderation = await openai.moderations.create({
      input: content,
    })

    const result = moderation.results[0]
    
    return {
      flagged: result.flagged,
      categories: result.categories,
      status: result.flagged ? 'flagged' : 'approved',
    }
  } catch (error) {
    console.error('Moderation error:', error)
    return { flagged: false, status: 'approved' }
  }
}
