import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import { formatResumeProperNouns } from "@/lib/formatDisplay";
import type { ResumeState } from "@/types/resume";
import type { TemplateId } from "@/templates/registry";

type PdfProps = {
  resume: ResumeState;
  photoUrl?: string | null;
};

function contactItems(resume: ResumeState) {
  const info = resume.personal_info;
  const clean = (value: unknown) => {
    if (value == null) return "";
    const text = String(value).trim();
    if (!text || /^(null|undefined|nil|none|n\/a)$/i.test(text)) return "";
    return text;
  };
  return [
    clean(info.email),
    clean(info.phone),
    clean(info.location),
    clean(info.linkedin_url),
    clean(info.github_url),
  ].filter(Boolean);
}

function dateLabel(start: unknown, end: unknown, current: boolean) {
  const clean = (value: unknown) => {
    if (value == null) return "";
    const text = String(value).trim();
    if (!text || /^(null|undefined|nil|none|n\/a)$/i.test(text)) return "";
    return text;
  };
  return [clean(start), current ? "Present" : clean(end)].filter(Boolean).join(" – ");
}

function SharedSections({
  resume,
  styles,
}: {
  resume: ResumeState;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  styles: any;
}) {
  return (
    <>
      {resume.summary ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Summary</Text>
          <Text style={styles.summary}>{resume.summary}</Text>
        </View>
      ) : null}

      {resume.work_experience.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Experience</Text>
          {resume.work_experience.map((job) => (
            <View key={job.id} style={{ marginBottom: 8 }}>
              <View style={styles.jobHeader}>
                <Text style={styles.jobTitle}>{job.position || "Job title"}</Text>
                <Text style={styles.dates}>
                  {dateLabel(job.start_date, job.end_date, job.current)}
                </Text>
              </View>
              <Text style={styles.company}>{job.company || "Company"}</Text>
              {job.bullet_points
                .filter((bullet) => bullet.trim().length > 0)
                .map((bullet, index) => (
                  <Text key={`${job.id}-${index}`} style={styles.bullet}>
                    • {bullet}
                  </Text>
                ))}
            </View>
          ))}
        </View>
      ) : null}

      {(resume.skills.technical.length > 0 || resume.skills.soft.length > 0) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Skills</Text>
          {resume.skills.technical.length > 0 ? (
            <Text style={styles.skillLine}>
              <Text style={styles.skillLabel}>Technical: </Text>
              {resume.skills.technical.join(", ")}
            </Text>
          ) : null}
          {resume.skills.soft.length > 0 ? (
            <Text style={styles.skillLine}>
              <Text style={styles.skillLabel}>Soft: </Text>
              {resume.skills.soft.join(", ")}
            </Text>
          ) : null}
        </View>
      )}

      {resume.education.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Education</Text>
          {resume.education.map((edu) => (
            <View key={edu.id} style={{ marginBottom: 6 }}>
              <View style={styles.eduHeader}>
                <Text style={styles.institution}>
                  {edu.institution || "Institution"}
                </Text>
                <Text style={styles.dates}>{edu.graduation_year}</Text>
              </View>
              <Text style={styles.company}>
                {edu.degree || "Degree / Field of study"}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </>
  );
}

const classicStyles = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingBottom: 36,
    paddingHorizontal: 40,
    fontSize: 10,
    fontFamily: "Times-Roman",
    color: "#0f172a",
  },
  header: { alignItems: "center", marginBottom: 14 },
  photo: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginBottom: 8,
    objectFit: "cover",
  },
  name: {
    fontSize: 20,
    fontFamily: "Times-Bold",
    textAlign: "center",
    marginBottom: 4,
  },
  role: {
    fontSize: 11,
    textAlign: "center",
    color: "#475569",
    marginBottom: 6,
  },
  contactRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginBottom: 4,
    color: "#475569",
    fontSize: 9,
  },
  contactItem: { marginHorizontal: 4 },
  section: { marginTop: 12 },
  sectionTitle: {
    fontSize: 10,
    fontFamily: "Times-Bold",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    borderBottomWidth: 1,
    borderBottomColor: "#0f172a",
    paddingBottom: 3,
    marginBottom: 6,
  },
  summary: { lineHeight: 1.45, color: "#334155" },
  jobHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  jobTitle: { fontFamily: "Times-Bold", fontSize: 11 },
  dates: { color: "#64748b", fontSize: 9 },
  company: { marginBottom: 3, color: "#334155" },
  bullet: { marginLeft: 10, marginBottom: 2, lineHeight: 1.4, color: "#334155" },
  skillLine: { marginBottom: 3, lineHeight: 1.4 },
  skillLabel: { fontFamily: "Times-Bold" },
  eduHeader: { flexDirection: "row", justifyContent: "space-between" },
  institution: { fontFamily: "Times-Bold", fontSize: 11 },
});

function ClassicPdf({ resume, photoUrl }: PdfProps) {
  const info = resume.personal_info;
  const contact = contactItems(resume);
  return (
    <Document>
      <Page size="A4" style={classicStyles.page}>
        <View style={classicStyles.header}>
          {photoUrl ? <Image src={photoUrl} style={classicStyles.photo} /> : null}
          <Text style={classicStyles.name}>
            {info.full_name || "Your Full Name"}
          </Text>
          {info.target_role ? (
            <Text style={classicStyles.role}>{info.target_role}</Text>
          ) : null}
          <View style={classicStyles.contactRow}>
            {contact.map((item) => (
              <Text key={item} style={classicStyles.contactItem}>
                {item}
              </Text>
            ))}
          </View>
        </View>
        <SharedSections resume={resume} styles={classicStyles} />
      </Page>
    </Document>
  );
}

const modernStyles = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingBottom: 36,
    paddingLeft: 48,
    paddingRight: 36,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#0f172a",
    borderLeftWidth: 8,
    borderLeftColor: "#0f766e",
  },
  header: { flexDirection: "row", marginBottom: 16, gap: 12 },
  photo: {
    width: 58,
    height: 58,
    borderRadius: 6,
    objectFit: "cover",
  },
  headerText: { flex: 1 },
  name: { fontSize: 20, fontFamily: "Helvetica-Bold", marginBottom: 3 },
  role: {
    fontSize: 11,
    color: "#0f766e",
    fontFamily: "Helvetica-Bold",
    marginBottom: 6,
  },
  contactRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 2,
    color: "#475569",
    fontSize: 9,
  },
  contactItem: { marginRight: 8 },
  section: { marginTop: 12 },
  sectionTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 1.4,
    borderBottomWidth: 1,
    borderBottomColor: "#0f766e",
    paddingBottom: 3,
    marginBottom: 6,
    color: "#0f766e",
  },
  summary: { lineHeight: 1.45, color: "#334155" },
  jobHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  jobTitle: { fontFamily: "Helvetica-Bold", fontSize: 11 },
  dates: { color: "#64748b", fontSize: 9 },
  company: { marginBottom: 3, color: "#334155" },
  bullet: { marginLeft: 10, marginBottom: 2, lineHeight: 1.4, color: "#334155" },
  skillLine: { marginBottom: 3, lineHeight: 1.4 },
  skillLabel: { fontFamily: "Helvetica-Bold" },
  eduHeader: { flexDirection: "row", justifyContent: "space-between" },
  institution: { fontFamily: "Helvetica-Bold", fontSize: 11 },
});

function ModernPdf({ resume, photoUrl }: PdfProps) {
  const info = resume.personal_info;
  const contact = contactItems(resume);
  return (
    <Document>
      <Page size="A4" style={modernStyles.page}>
        <View style={modernStyles.header}>
          {photoUrl ? <Image src={photoUrl} style={modernStyles.photo} /> : null}
          <View style={modernStyles.headerText}>
            <Text style={modernStyles.name}>
              {info.full_name || "Your Full Name"}
            </Text>
            {info.target_role ? (
              <Text style={modernStyles.role}>{info.target_role}</Text>
            ) : null}
            <View style={modernStyles.contactRow}>
              {contact.map((item) => (
                <Text key={item} style={modernStyles.contactItem}>
                  {item}
                </Text>
              ))}
            </View>
          </View>
        </View>
        <SharedSections resume={resume} styles={modernStyles} />
      </Page>
    </Document>
  );
}

const compactStyles = StyleSheet.create({
  page: {
    paddingTop: 26,
    paddingBottom: 26,
    paddingHorizontal: 32,
    fontSize: 9,
    fontFamily: "Helvetica",
    color: "#0f172a",
  },
  name: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    marginBottom: 2,
  },
  role: { fontSize: 9, color: "#475569", marginBottom: 4 },
  contactRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 8,
    color: "#475569",
    fontSize: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#94a3b8",
    paddingBottom: 6,
  },
  contactItem: { marginRight: 8 },
  section: { marginTop: 8 },
  sectionTitle: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 1,
    borderBottomWidth: 1,
    borderBottomColor: "#64748b",
    paddingBottom: 2,
    marginBottom: 4,
  },
  summary: { lineHeight: 1.35, color: "#334155" },
  jobHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 1,
  },
  jobTitle: { fontFamily: "Helvetica-Bold", fontSize: 10 },
  dates: { color: "#64748b", fontSize: 8 },
  company: { marginBottom: 2, color: "#334155" },
  bullet: { marginLeft: 8, marginBottom: 1, lineHeight: 1.3, color: "#334155" },
  skillLine: { marginBottom: 2, lineHeight: 1.3 },
  skillLabel: { fontFamily: "Helvetica-Bold" },
  eduHeader: { flexDirection: "row", justifyContent: "space-between" },
  institution: { fontFamily: "Helvetica-Bold", fontSize: 10 },
});

function CompactPdf({ resume }: PdfProps) {
  const info = resume.personal_info;
  const contact = contactItems(resume);
  return (
    <Document>
      <Page size="A4" style={compactStyles.page}>
        <Text style={compactStyles.name}>
          {info.full_name || "Your Full Name"}
        </Text>
        {info.target_role ? (
          <Text style={compactStyles.role}>{info.target_role}</Text>
        ) : null}
        <View style={compactStyles.contactRow}>
          {contact.map((item) => (
            <Text key={item} style={compactStyles.contactItem}>
              {item}
            </Text>
          ))}
        </View>
        <SharedSections resume={resume} styles={compactStyles} />
      </Page>
    </Document>
  );
}

const executiveStyles = StyleSheet.create({
  ...classicStyles,
  page: {
    ...classicStyles.page,
    paddingTop: 44,
    paddingHorizontal: 46,
    fontFamily: "Times-Roman",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: "#0f172a",
    paddingBottom: 12,
  },
  name: {
    fontSize: 24,
    fontFamily: "Times-Bold",
    textAlign: "left",
    marginBottom: 4,
  },
  role: {
    fontSize: 11,
    textAlign: "left",
    color: "#475569",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  contactRow: {
    ...classicStyles.contactRow,
    justifyContent: "flex-start",
  },
  photo: {
    width: 60,
    height: 60,
    borderRadius: 6,
    objectFit: "cover",
  },
});

function ExecutivePdf({ resume, photoUrl }: PdfProps) {
  const info = resume.personal_info;
  const contact = contactItems(resume);
  return (
    <Document>
      <Page size="A4" style={executiveStyles.page}>
        <View style={executiveStyles.header}>
          <View style={{ flex: 1 }}>
            <Text style={executiveStyles.name}>
              {info.full_name || "Your Full Name"}
            </Text>
            {info.target_role ? (
              <Text style={executiveStyles.role}>{info.target_role}</Text>
            ) : null}
            <View style={executiveStyles.contactRow}>
              {contact.map((item) => (
                <Text key={item} style={classicStyles.contactItem}>
                  {item}
                </Text>
              ))}
            </View>
          </View>
          {photoUrl ? (
            <Image src={photoUrl} style={executiveStyles.photo} />
          ) : null}
        </View>
        <SharedSections resume={resume} styles={classicStyles} />
      </Page>
    </Document>
  );
}

const creativeStyles = StyleSheet.create({
  ...modernStyles,
  banner: {
    backgroundColor: "#0f766e",
    paddingTop: 22,
    paddingBottom: 18,
    paddingHorizontal: 36,
    marginBottom: 16,
    marginHorizontal: -36,
    marginTop: -36,
  },
  name: { fontSize: 20, fontFamily: "Helvetica-Bold", color: "#ffffff" },
  role: {
    fontSize: 11,
    color: "#ccfbf1",
    marginTop: 3,
    fontFamily: "Helvetica-Bold",
  },
  contactRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
  },
  contactItem: { marginRight: 8, fontSize: 9, color: "#ecfdf5" },
  photo: {
    width: 52,
    height: 52,
    borderRadius: 6,
    objectFit: "cover",
    marginRight: 12,
  },
  headerRow: { flexDirection: "row", alignItems: "center" },
});

function CreativePdf({ resume, photoUrl }: PdfProps) {
  const info = resume.personal_info;
  const contact = contactItems(resume);
  return (
    <Document>
      <Page size="A4" style={modernStyles.page}>
        <View style={creativeStyles.banner}>
          <View style={creativeStyles.headerRow}>
            {photoUrl ? (
              <Image src={photoUrl} style={creativeStyles.photo} />
            ) : null}
            <View style={{ flex: 1 }}>
              <Text style={creativeStyles.name}>
                {info.full_name || "Your Full Name"}
              </Text>
              {info.target_role ? (
                <Text style={creativeStyles.role}>{info.target_role}</Text>
              ) : null}
              <View style={creativeStyles.contactRow}>
                {contact.map((item) => (
                  <Text key={item} style={creativeStyles.contactItem}>
                    {item}
                  </Text>
                ))}
              </View>
            </View>
          </View>
        </View>
        <SharedSections resume={resume} styles={modernStyles} />
      </Page>
    </Document>
  );
}

const twoColStyles = StyleSheet.create({
  page: { flexDirection: "row", fontFamily: "Helvetica", color: "#0f172a" },
  sidebar: {
    width: "34%",
    backgroundColor: "#0f172a",
    paddingTop: 28,
    paddingBottom: 28,
    paddingHorizontal: 16,
    color: "#e2e8f0",
  },
  main: {
    width: "66%",
    paddingTop: 28,
    paddingBottom: 28,
    paddingHorizontal: 22,
    fontSize: 10,
  },
  photo: {
    width: 54,
    height: 54,
    borderRadius: 6,
    marginBottom: 10,
    objectFit: "cover",
  },
  name: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
    marginBottom: 3,
  },
  role: { fontSize: 9, color: "#5eead4", marginBottom: 8 },
  sideLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#5eead4",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: 14,
    marginBottom: 4,
  },
  sideText: { fontSize: 8, color: "#cbd5e1", lineHeight: 1.35, marginBottom: 2 },
});

function TwoColumnPdf({ resume, photoUrl }: PdfProps) {
  const info = resume.personal_info;
  const contact = contactItems(resume);
  return (
    <Document>
      <Page size="A4" style={twoColStyles.page}>
        <View style={twoColStyles.sidebar}>
          {photoUrl ? (
            <Image src={photoUrl} style={twoColStyles.photo} />
          ) : null}
          <Text style={twoColStyles.name}>
            {info.full_name || "Your Full Name"}
          </Text>
          {info.target_role ? (
            <Text style={twoColStyles.role}>{info.target_role}</Text>
          ) : null}
          <Text style={twoColStyles.sideLabel}>Contact</Text>
          {contact.map((item) => (
            <Text key={item} style={twoColStyles.sideText}>
              {item}
            </Text>
          ))}
          <Text style={twoColStyles.sideLabel}>Skills</Text>
          {resume.skills.technical.length > 0 ? (
            <Text style={twoColStyles.sideText}>
              Tech: {resume.skills.technical.join(", ")}
            </Text>
          ) : null}
          {resume.skills.soft.length > 0 ? (
            <Text style={twoColStyles.sideText}>
              Soft: {resume.skills.soft.join(", ")}
            </Text>
          ) : null}
        </View>
        <View style={twoColStyles.main}>
          <SharedSections
            resume={{
              ...resume,
              skills: { technical: [], soft: [] },
            }}
            styles={modernStyles}
          />
        </View>
      </Page>
    </Document>
  );
}

const minimalStyles = StyleSheet.create({
  ...compactStyles,
  page: {
    ...compactStyles.page,
    paddingTop: 30,
    paddingHorizontal: 40,
  },
  name: {
    fontSize: 18,
    fontFamily: "Helvetica",
    marginBottom: 2,
  },
  sectionTitle: {
    ...compactStyles.sectionTitle,
    borderBottomColor: "#cbd5e1",
    letterSpacing: 2,
  },
});

function MinimalPdf({ resume }: PdfProps) {
  const info = resume.personal_info;
  const contact = contactItems(resume);
  return (
    <Document>
      <Page size="A4" style={minimalStyles.page}>
        <Text style={minimalStyles.name}>
          {info.full_name || "Your Full Name"}
        </Text>
        {info.target_role ? (
          <Text style={compactStyles.role}>{info.target_role}</Text>
        ) : null}
        <View style={compactStyles.contactRow}>
          {contact.map((item) => (
            <Text key={item} style={compactStyles.contactItem}>
              {item}
            </Text>
          ))}
        </View>
        <SharedSections resume={resume} styles={minimalStyles} />
      </Page>
    </Document>
  );
}

const timelineStyles = StyleSheet.create({
  ...modernStyles,
  rail: {
    borderLeftWidth: 2,
    borderLeftColor: "#0f766e",
    paddingLeft: 12,
    marginTop: 4,
  },
  dotWrap: { marginBottom: 10 },
  dates: { color: "#0f766e", fontSize: 9, marginBottom: 2 },
});

function TimelinePdf({ resume, photoUrl }: PdfProps) {
  const info = resume.personal_info;
  const contact = contactItems(resume);
  return (
    <Document>
      <Page size="A4" style={modernStyles.page}>
        <View style={modernStyles.header}>
          {photoUrl ? <Image src={photoUrl} style={modernStyles.photo} /> : null}
          <View style={modernStyles.headerText}>
            <Text style={modernStyles.name}>
              {info.full_name || "Your Full Name"}
            </Text>
            {info.target_role ? (
              <Text style={modernStyles.role}>{info.target_role}</Text>
            ) : null}
            <View style={modernStyles.contactRow}>
              {contact.map((item) => (
                <Text key={item} style={modernStyles.contactItem}>
                  {item}
                </Text>
              ))}
            </View>
          </View>
        </View>

        {resume.summary ? (
          <View style={modernStyles.section}>
            <Text style={modernStyles.sectionTitle}>Summary</Text>
            <Text style={modernStyles.summary}>{resume.summary}</Text>
          </View>
        ) : null}

        {resume.work_experience.length > 0 ? (
          <View style={modernStyles.section}>
            <Text style={modernStyles.sectionTitle}>Experience</Text>
            <View style={timelineStyles.rail}>
              {resume.work_experience.map((job) => (
                <View key={job.id} style={timelineStyles.dotWrap}>
                  <Text style={timelineStyles.dates}>
                    {dateLabel(job.start_date, job.end_date, job.current)}
                  </Text>
                  <Text style={modernStyles.jobTitle}>
                    {job.position || "Job title"}
                  </Text>
                  <Text style={modernStyles.company}>
                    {job.company || "Company"}
                  </Text>
                  {job.bullet_points
                    .filter((b) => b.trim())
                    .map((bullet, index) => (
                      <Text key={`${job.id}-${index}`} style={modernStyles.bullet}>
                        • {bullet}
                      </Text>
                    ))}
                </View>
              ))}
            </View>
          </View>
        ) : null}

        <SharedSections
          resume={{ ...resume, summary: "", work_experience: [] }}
          styles={modernStyles}
        />
      </Page>
    </Document>
  );
}

type ResumePdfDocumentProps = {
  resume: ResumeState;
  template?: TemplateId;
  photoUrl?: string | null;
};

export function ResumePdfDocument({
  resume,
  template = "classic",
  photoUrl = null,
}: ResumePdfDocumentProps) {
  const presented = formatResumeProperNouns(resume);

  switch (template) {
    case "modern":
      return <ModernPdf resume={presented} photoUrl={photoUrl} />;
    case "compact":
      return <CompactPdf resume={presented} />;
    case "executive":
      return <ExecutivePdf resume={presented} photoUrl={photoUrl} />;
    case "creative":
      return <CreativePdf resume={presented} photoUrl={photoUrl} />;
    case "two_column":
      return <TwoColumnPdf resume={presented} photoUrl={photoUrl} />;
    case "minimal":
      return <MinimalPdf resume={presented} />;
    case "timeline":
      return <TimelinePdf resume={presented} photoUrl={photoUrl} />;
    case "classic":
    default:
      return <ClassicPdf resume={presented} photoUrl={photoUrl} />;
  }
}
