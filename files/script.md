# Luna Shield Presentation Script

## Script

**0:00 - 0:40**

Good [morning/afternoon]. Imagine an analyst receives a phishing email, a suspicious link, and a few unusual financial signals around the same case. Today, those clues usually live in different tools, different dashboards, and different teams. That delay is exactly where modern threats win.

We built **Luna Shield**, an AI-powered investigation platform that helps analysts detect threats, connect signals, and move from raw evidence to explainable decisions faster.

**0:40 - 1:30**

The problem is not just detection. The real problem is fragmentation.

Existing tools are often narrow. One tool scans emails. Another looks at URLs. Another helps with fraud. AML systems focus only on financial movement, while cyber tools often ignore the financial trail completely. And generic AI chatbots can summarize content, but they do not give investigators structured evidence, explainable scoring, or a graph of relationships they can actually act on.

So analysts are forced to manually connect content, infrastructure, actors, and transactions. That is slow, expensive, and risky.

**1:30 - 2:25**

Our solution is to unify those worlds.

**Luna Shield** combines digital threat intelligence with financial threat investigation in one platform. It can take suspicious inputs like emails, SMS messages, URLs, screenshots, documents, or raw text, extract the critical indicators, score the risk, and then visualize the relationships behind the threat.

And if the case has a financial crime angle, Luna can pivot into **AML and illicit finance analysis**, using our existing six-pattern classification pipeline.

So instead of asking analysts to jump across tools, Luna gives them one workflow for content analysis, investigation, and financial threat correlation.

**2:25 - 3:35**

Here is what makes this different.

First, Luna is not just a chatbot. It is a structured investigation system.

Second, it is **explainable**. We do not just output a score. We break risk down into content risk, infrastructure risk, behavior risk, and eventually graph and financial risk, so the analyst understands why something was flagged.

Third, it is **graph-first**. Every entity, indicator, and relationship can become part of a network view. That means investigators can move from one suspicious artifact to the broader campaign or money flow behind it.

And fourth, it is **hybrid by design**. We combine deterministic extraction and scoring with AI reasoning, so the system stays demo-friendly, explainable, and extensible.

**3:35 - 4:50**

From a technical perspective, Luna has three major layers.

The frontend is built in **Next.js**, where the analyst interacts with the investigation console, the structured analysis workbench, the chat system, and the graph views.

The main backend streams AI responses, handles ingestion, extracts indicators and entities, enriches findings, and converts investigator prompts into structured graph payloads.

Then the ML layer, built in **FastAPI with graph-based models**, classifies suspicious financial patterns across six AML typologies, including **round-tripping, loan evergreening, invoice fraud, hawala, benami structures, and PEP kickbacks**.

So the system can reason in natural language, but it can also map that reasoning into a graph and score it using pattern-aware models.

**4:50 - 6:10**

Let me walk through the user flow.

An analyst starts by opening Luna’s **Analyze** workspace and submits suspicious content, for example a phishing email, a smishing message, or a suspicious URL.

Luna normalizes that input, extracts IOCs such as domains, emails, phone numbers, or wallet addresses, and identifies entities like sender, target brand, urgency tactics, or suspicious requests.

Next, the system generates an **explainable risk score** with evidence. So instead of saying “this looks bad,” it tells you why: maybe there is impersonation language, a suspicious domain pattern, pressure tactics, or credential-harvesting behavior.

Then Luna can render a **graph** showing how the artifact, indicators, and entities relate to each other. That gives the analyst an immediate visual map of the threat.

After that, the investigator can move into the chat console and ask deeper questions. The AI assistant can summarize the case, connect findings, and in financial-threat mode, generate a structured AML schema.

That schema is then sent to the ML server, which classifies which suspicious typology the case most closely matches.

So the platform takes you from raw content, to evidence, to graph, to pattern classification, all in one flow.

**6:10 - 7:00**

Why does this matter in a hackathon setting?

Because this is not just “AI answering questions.” It is a platform with a strong product story:

one, it solves a real workflow problem;  
two, it is technically layered and defensible;  
three, it is explainable for judges and analysts;  
and four, it has a clear expansion path.

Most demos stop at detection. Luna goes further into **correlation, interpretation, and investigator action**.

That is our edge.

**7:00 - 7:30**

To close, **Luna Shield helps analysts detect threats, connect digital and financial signals, and investigate with clarity instead of guesswork**.

It brings together AI analysis, explainable scoring, graph intelligence, and AML pattern detection into one investigation platform.

Thank you.

## Delivery Notes

Use this one-line opener with confidence:

**“Modern threats do not stay in one domain, so investigation tools should not stay in one silo.”**

If they ask what is most innovative, say:

**“Luna’s strongest differentiator is that it connects digital threat analysis and financial threat classification through explainable graphs, instead of treating them as separate systems.”**
