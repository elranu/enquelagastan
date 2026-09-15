# Writing style: ASD-STE100 Simplified Technical English

Everything written into this repo or onto GitHub is in English: commit messages, PR
titles and bodies, code review replies, code comments, and documentation. The
conversation with the user is often in Spanish. That says nothing about the language
of the artifact.

Write that English in **ASD-STE100 Simplified Technical English**. STE is a
controlled language. It was made so that a reader who does not speak English as a
first language can read a technical text one time and understand it. This team is
not made of native speakers, and much of what we write is read months later by
somebody who was not in the conversation. STE is a good fit for both.

## The rules

1. **One word, one meaning.** Use the same word for the same thing every time. Do
   not change words for variety. If it is a `payment hub` in one line, it is a
   `payment hub` in the next one, not a "processing unit".
2. **One meaning, one word.** Do not use a word for two different things.
3. **Keep sentences short.** 20 words maximum for an instruction. 25 words maximum
   for a description.
4. **One instruction per sentence.** Two steps are two sentences.
5. **Use the active voice.** Write "the worker sends the message", not "the message
   is sent by the worker".
6. **Use simple verb tenses.** Use the present, the past, or the future. Do not use
   a gerund or a participle where a plain verb does the work.
7. **Keep the articles.** Write "start the worker", not "start worker".
8. **Keep paragraphs short.** 6 sentences maximum.
9. **Do not build noun clusters.** 3 words maximum. Break a longer one with a
   preposition: "the status of the bank operation", not "the bank operation status
   value".
10. **Write positively.** Say what to do, not only what to avoid.
11. **No idioms, no slang, no metaphors.** They are the first thing a reader
    translates incorrectly.
12. **Give one instruction, then its reason.** Not the reason wrapped around three
    conditions.

## What STE does not touch

- **Technical names and technical verbs.** Identifiers, table names, queue names,
  API names, product names and command names keep their exact spelling:
  `temporary_payment_links`, `DiversifierManagerV2`, `npm run common:build`.
- **User-facing product copy.** That follows the locale of the product, not this
  rule. A payment link that a merchant in Argentina reads is in Spanish.
- **Existing content.** The repo is mixed today. This applies to what you write
  from now on. Do not translate old files unless somebody asks for it.

## An example

Before:

> Given that the previous implementation was silently swallowing the errors coming
> back from the provider, which in turn was making the reconciliation job appear to
> succeed while actually leaving orphaned operations behind, this change surfaces
> them.

After:

> The previous code did not report the errors of the provider. The reconciliation
> job looked successful, but it left orphaned operations. This change reports the
> errors.

Same content. Three short sentences, active voice, no clause stacking.
