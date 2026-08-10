"use client";

import {
  Resume,
  Education,
  Experience,
  Project,
  Certification,
  Links,
  SkillCategory,
} from "@/types";
import {
  Globe,
  Sparkles,
  Briefcase,
  GraduationCap,
  FolderOpen,
  Award,
  Languages,
} from "lucide-react";
import {
  SectionCard,
  FormField,
  AddItemButton,
  ArrayItemCard,
} from "./ResumeFormUI";

export interface ResumeFormProps {
  formData: Resume;
  updateField: (field: keyof Resume, value: any) => void;
  updateNestedField: <T extends object>(
    section: keyof Resume,
    index: number,
    field: keyof T,
    value: string
  ) => void;
  updateLinkField: (field: keyof Links, value: string) => void;
  addArrayItem: (section: keyof Resume, template: object) => void;
  removeArrayItem: (section: keyof Resume, index: number) => void;
}

export function ResumeFormFields({
  formData,
  updateField,
  updateNestedField,
  updateLinkField,
  addArrayItem,
  removeArrayItem,
}: ResumeFormProps) {
  return (
    <>
      {/* Personal Info */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="Full Name"
            id="edit-name"
            value={formData.name || ""}
            onChange={(e) => updateField("name", e.target.value)}
          />
          <FormField
            label="Title / Headline"
            id="edit-title"
            value={formData.title || ""}
            onChange={(e) => updateField("title", e.target.value)}
            placeholder="Software Engineer"
          />
          <FormField
            label="Email"
            id="edit-email"
            type="email"
            value={formData.email || ""}
            onChange={(e) => updateField("email", e.target.value)}
          />
          <FormField
            label="Phone"
            id="edit-phone"
            type="tel"
            value={formData.phone || ""}
            onChange={(e) => updateField("phone", e.target.value)}
          />
          <FormField
            label="Location"
            id="edit-location"
            value={formData.location || ""}
            onChange={(e) => updateField("location", e.target.value)}
          />
        </div>
      </div>

      {/* Links */}
      <SectionCard icon={<Globe size={18} />} title="Links">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            label="LinkedIn"
            id="edit-linkedin"
            value={formData.links?.linkedin || ""}
            onChange={(e) => updateLinkField("linkedin", e.target.value)}
            placeholder="https://linkedin.com/in/..."
          />
          <FormField
            label="GitHub"
            id="edit-github"
            value={formData.links?.github || ""}
            onChange={(e) => updateLinkField("github", e.target.value)}
            placeholder="https://github.com/..."
          />
          <FormField
            label="Portfolio"
            id="edit-portfolio"
            value={formData.links?.portfolio || ""}
            onChange={(e) => updateLinkField("portfolio", e.target.value)}
            placeholder="https://..."
          />
        </div>
      </SectionCard>

      {/* Summary */}
      <SectionCard icon={<Sparkles size={18} />} title="Professional Summary">
        <FormField
          label="Summary"
          id="edit-summary"
          value={formData.summary || ""}
          onChange={(e) => updateField("summary", e.target.value)}
          rows={4}
        />
      </SectionCard>

      {/* Skills */}
      <SectionCard icon={<Sparkles size={18} />} title="Skills">
        <p className="text-xs text-slate-400 mb-3">
          Comma-separated list of skills
        </p>
        <FormField
          label="Skills"
          id="edit-skills"
          value={
            Array.isArray(formData.skills) ? formData.skills.join(", ") : ""
          }
          onChange={(e) =>
            updateField(
              "skills",
              e.target.value
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
            )
          }
          rows={3}
          placeholder="JavaScript, Python, React, ..."
        />
      </SectionCard>

      {/* Skill Categories */}
      <SectionCard icon={<Sparkles size={18} />} title="Skill Categories">
        <p className="text-xs text-slate-400 mb-3">
          Optional: group skills under labels (e.g. &quot;Languages&quot;, &quot;Tools&quot;) to show on the resume as
          labeled rows instead of a flat list. Leave empty to use the flat Skills list above.
        </p>
        <div className="space-y-4">
          {formData.skill_categories?.map((cat, i) => (
            <ArrayItemCard key={i} onRemove={() => removeArrayItem("skill_categories", i)}>
              <div className="grid grid-cols-1 gap-3">
                <FormField
                  label="Category Label"
                  id={`skillcat-label-${i}`}
                  value={cat.label || ""}
                  onChange={(e) =>
                    updateNestedField<SkillCategory>(
                      "skill_categories",
                      i,
                      "label",
                      e.target.value
                    )
                  }
                  placeholder="Languages"
                />
                <FormField
                  label="Skills (comma-separated)"
                  id={`skillcat-skills-${i}`}
                  value={
                    Array.isArray(cat.skills) ? cat.skills.join(", ") : ""
                  }
                  onChange={(e) => {
                    const skills = e.target.value
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean);
                    updateNestedField<SkillCategory>(
                      "skill_categories",
                      i,
                      "skills",
                      skills as any
                    );
                  }}
                  placeholder="C, C++, Python"
                />
              </div>
            </ArrayItemCard>
          ))}
          <AddItemButton
            label="Add Skill Category"
            onClick={() =>
              addArrayItem("skill_categories", {
                label: "",
                skills: [],
              } as SkillCategory)
            }
          />
        </div>
      </SectionCard>

      {/* Experience */}
      <SectionCard icon={<Briefcase size={18} />} title="Experience">
        <div className="space-y-4">
          {formData.experience?.map((exp, i) => (
            <ArrayItemCard key={i} onRemove={() => removeArrayItem("experience", i)}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormField
                  label="Job Title"
                  id={`exp-title-${i}`}
                  value={exp.job_title || ""}
                  onChange={(e) =>
                    updateNestedField<Experience>(
                      "experience",
                      i,
                      "job_title",
                      e.target.value
                    )
                  }
                />
                <FormField
                  label="Company"
                  id={`exp-company-${i}`}
                  value={exp.company || ""}
                  onChange={(e) =>
                    updateNestedField<Experience>(
                      "experience",
                      i,
                      "company",
                      e.target.value
                    )
                  }
                />
                <FormField
                  label="Location"
                  id={`exp-location-${i}`}
                  value={exp.location || ""}
                  onChange={(e) =>
                    updateNestedField<Experience>(
                      "experience",
                      i,
                      "location",
                      e.target.value
                    )
                  }
                />
                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    label="Start Date"
                    id={`exp-start-${i}`}
                    value={exp.start_date || ""}
                    onChange={(e) =>
                      updateNestedField<Experience>(
                        "experience",
                        i,
                        "start_date",
                        e.target.value
                      )
                    }
                  />
                  <FormField
                    label="End Date"
                    id={`exp-end-${i}`}
                    value={exp.end_date || ""}
                    onChange={(e) =>
                      updateNestedField<Experience>(
                        "experience",
                        i,
                        "end_date",
                        e.target.value
                      )
                    }
                    placeholder="Present"
                  />
                </div>
              </div>
              <div className="mt-3">
                <FormField
                  label="Description"
                  id={`exp-desc-${i}`}
                  value={exp.description || ""}
                  onChange={(e) =>
                    updateNestedField<Experience>(
                      "experience",
                      i,
                      "description",
                      e.target.value
                    )
                  }
                  rows={3}
                />
              </div>
            </ArrayItemCard>
          ))}
          <AddItemButton
            label="Add Experience"
            onClick={() =>
              addArrayItem("experience", {
                job_title: "",
                company: "",
                location: "",
                start_date: "",
                end_date: "",
                description: "",
              } as Experience)
            }
          />
        </div>
      </SectionCard>

      {/* Education */}
      <SectionCard icon={<GraduationCap size={18} />} title="Education">
        <div className="space-y-4">
          {formData.education?.map((edu, i) => (
            <ArrayItemCard key={i} onRemove={() => removeArrayItem("education", i)}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormField
                  label="Degree"
                  id={`edu-degree-${i}`}
                  value={edu.degree || ""}
                  onChange={(e) =>
                    updateNestedField<Education>(
                      "education",
                      i,
                      "degree",
                      e.target.value
                    )
                  }
                />
                <FormField
                  label="Field of Study"
                  id={`edu-field-${i}`}
                  value={edu.field_of_study || ""}
                  onChange={(e) =>
                    updateNestedField<Education>(
                      "education",
                      i,
                      "field_of_study",
                      e.target.value
                    )
                  }
                />
                <FormField
                  label="Institution"
                  id={`edu-inst-${i}`}
                  value={edu.institution || ""}
                  onChange={(e) =>
                    updateNestedField<Education>(
                      "education",
                      i,
                      "institution",
                      e.target.value
                    )
                  }
                />
                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    label="Start Year"
                    id={`edu-start-${i}`}
                    value={edu.start_year || ""}
                    onChange={(e) =>
                      updateNestedField<Education>(
                        "education",
                        i,
                        "start_year",
                        e.target.value
                      )
                    }
                  />
                  <FormField
                    label="End Year"
                    id={`edu-end-${i}`}
                    value={edu.end_year || ""}
                    onChange={(e) =>
                      updateNestedField<Education>(
                        "education",
                        i,
                        "end_year",
                        e.target.value
                      )
                    }
                    placeholder="Present"
                  />
                </div>
              </div>
            </ArrayItemCard>
          ))}
          <AddItemButton
            label="Add Education"
            onClick={() =>
              addArrayItem("education", {
                degree: "",
                field_of_study: "",
                institution: "",
                start_year: "",
                end_year: "",
              } as Education)
            }
          />
        </div>
      </SectionCard>

      {/* Projects */}
      <SectionCard icon={<FolderOpen size={18} />} title="Projects">
        <div className="space-y-4">
          {formData.projects?.map((proj, i) => (
            <ArrayItemCard key={i} onRemove={() => removeArrayItem("projects", i)}>
              <div className="grid grid-cols-1 gap-3">
                <FormField
                  label="Name"
                  id={`proj-name-${i}`}
                  value={proj.name || ""}
                  onChange={(e) =>
                    updateNestedField<Project>(
                      "projects",
                      i,
                      "name",
                      e.target.value
                    )
                  }
                />
                <FormField
                  label="Description"
                  id={`proj-desc-${i}`}
                  value={proj.description || ""}
                  onChange={(e) =>
                    updateNestedField<Project>(
                      "projects",
                      i,
                      "description",
                      e.target.value
                    )
                  }
                  rows={2}
                />
                <FormField
                  label="Technologies (comma-separated)"
                  id={`proj-tech-${i}`}
                  value={
                    Array.isArray(proj.technologies)
                      ? proj.technologies.join(", ")
                      : ""
                  }
                  onChange={(e) => {
                    const techs = e.target.value
                      .split(",")
                      .map((t) => t.trim())
                      .filter(Boolean);
                    updateNestedField<Project>(
                      "projects",
                      i,
                      "technologies",
                      techs as any
                    );
                  }}
                  placeholder="React, Node.js, ..."
                />
              </div>
            </ArrayItemCard>
          ))}
          <AddItemButton
            label="Add Project"
            onClick={() =>
              addArrayItem("projects", {
                name: "",
                description: "",
                technologies: [],
              } as Project)
            }
          />
        </div>
      </SectionCard>

      {/* Certifications */}
      <SectionCard icon={<Award size={18} />} title="Certifications">
        <div className="space-y-4">
          {formData.certifications?.map((cert, i) => (
            <ArrayItemCard key={i} onRemove={() => removeArrayItem("certifications", i)}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <FormField
                  label="Name"
                  id={`cert-name-${i}`}
                  value={cert.name || ""}
                  onChange={(e) =>
                    updateNestedField<Certification>(
                      "certifications",
                      i,
                      "name",
                      e.target.value
                    )
                  }
                />
                <FormField
                  label="Issuer"
                  id={`cert-issuer-${i}`}
                  value={cert.issuer || ""}
                  onChange={(e) =>
                    updateNestedField<Certification>(
                      "certifications",
                      i,
                      "issuer",
                      e.target.value
                    )
                  }
                />
                <FormField
                  label="Year"
                  id={`cert-year-${i}`}
                  value={cert.year || ""}
                  onChange={(e) =>
                    updateNestedField<Certification>(
                      "certifications",
                      i,
                      "year",
                      e.target.value
                    )
                  }
                />
              </div>
            </ArrayItemCard>
          ))}
          <AddItemButton
            label="Add Certification"
            onClick={() =>
              addArrayItem("certifications", {
                name: "",
                issuer: "",
                year: "",
              } as Certification)
            }
          />
        </div>
      </SectionCard>

      {/* Languages */}
      <SectionCard icon={<Languages size={18} />} title="Languages">
        <p className="text-xs text-slate-400 mb-3">
          Comma-separated list of languages
        </p>
        <FormField
          label="Languages"
          id="edit-languages"
          value={
            Array.isArray(formData.languages)
              ? formData.languages.join(", ")
              : ""
          }
          onChange={(e) =>
            updateField(
              "languages",
              e.target.value
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
            )
          }
          placeholder="English, Spanish, ..."
        />
      </SectionCard>
    </>
  );
}
