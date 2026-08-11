export type LegalBlock =
  | { type: "p"; text: string }
  | { type: "list"; items: string[] }
  | { type: "note"; text: string };

export type LegalSection = {
  heading: string;
  blocks: LegalBlock[];
};

export function LegalArticle({
  title,
  updated,
  intro,
  sections,
}: {
  title: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
}) {
  return (
    <article>
      <h1 className="text-3xl font-bold text-foreground">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Cập nhật lần cuối: {updated}
      </p>
      <p className="mt-6 text-[15px] leading-relaxed text-muted-foreground">
        {intro}
      </p>

      <div className="mt-10 space-y-10">
        {sections.map((section, i) => (
          <section key={section.heading}>
            <h2 className="text-lg font-semibold text-foreground">
              {i + 1}. {section.heading}
            </h2>
            <div className="mt-3 space-y-3">
              {section.blocks.map((block, j) => {
                if (block.type === "list") {
                  return (
                    <ul
                      key={j}
                      className="list-disc pl-5 space-y-1.5 text-[15px] leading-relaxed text-muted-foreground"
                    >
                      {block.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  );
                }
                if (block.type === "note") {
                  return (
                    <p
                      key={j}
                      className="rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-[15px] leading-relaxed text-foreground"
                    >
                      {block.text}
                    </p>
                  );
                }
                return (
                  <p
                    key={j}
                    className="text-[15px] leading-relaxed text-muted-foreground"
                  >
                    {block.text}
                  </p>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </article>
  );
}
