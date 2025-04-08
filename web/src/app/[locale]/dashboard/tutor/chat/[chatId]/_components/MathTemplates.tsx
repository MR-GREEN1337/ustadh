"use client";

import React, { useMemo } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuGroup,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Calculator,
  LineChart,
  Sigma,
  SquareFunction,
  Triangle,
  Atom,
  Activity,
  SquareEqual
} from 'lucide-react';
import { useLocale, useTranslation } from '@/i18n/client';

interface MathTemplatesProps {
  onSelectTemplate: (template: string) => void;
}

export function MathTemplates({ onSelectTemplate }: MathTemplatesProps) {
  const { t } = useTranslation();
  const locale = useLocale();

  // Define templates by language
  const templatesByLanguage = useMemo(() => {
    return {
      en: {
        categories: [
          {
            category: "Algebra",
            icon: <Calculator className="h-4 w-4 mr-2" />,
            templates: [
              {
                name: "Quadratic Formula",
                content: "To solve the quadratic equation ax² + bx + c = 0, the formula is:\n\nx = (-b ± √(b² - 4ac)) / 2a\n\nCan you help me solve this equation: "
              },
              {
                name: "Linear Systems",
                content: "I need help solving this system of linear equations:\n\n3x + 2y = 7\n5x - y = 3\n\nWhat are the values of x and y?"
              },
              {
                name: "Polynomial Factoring",
                content: "How can I factor this polynomial expression?\n\nx³ - 6x² + 11x - 6"
              }
            ]
          },
          {
            category: "Calculus",
            icon: <LineChart className="h-4 w-4 mr-2" />,
            templates: [
              {
                name: "Derivative",
                content: "Can you calculate the derivative of this function?\n\nf(x) = 3x⁵ - 2x³ + 5x - 7"
              },
              {
                name: "Integral",
                content: "I need to calculate this integral:\n\n∫ (x² + 3x - 2) dx"
              },
              {
                name: "Limits",
                content: "How do I evaluate this limit?\n\nlim (x→2) (x³ - 8) / (x - 2)"
              }
            ]
          },
          {
            category: "Geometry",
            icon: <Triangle className="h-4 w-4 mr-2" />,
            templates: [
              {
                name: "Triangle Area",
                content: "How do I calculate the area of a triangle with sides of length a = 5 cm, b = 7 cm, and c = 9 cm?"
              },
              {
                name: "Circle Properties",
                content: "What are the formulas to calculate the circumference and area of a circle with radius r = 4 cm?"
              },
              {
                name: "Vector Operations",
                content: "How do I calculate the cross product of these two vectors?\n\nA = (3, -2, 5)\nB = (1, 4, -2)"
              }
            ]
          },
          {
            category: "Physics",
            icon: <Atom className="h-4 w-4 mr-2" />,
            templates: [
              {
                name: "Kinematics",
                content: "An object is thrown vertically upward with an initial velocity of 20 m/s. What maximum height will it reach? (g = 9.8 m/s²)"
              },
              {
                name: "Newton's Laws",
                content: "A force of 50 N is applied to an object with a mass of 10 kg. What is its acceleration according to Newton's second law?"
              },
              {
                name: "Electromagnetism",
                content: "How do I calculate the electric force between two point charges q₁ = 3 μC and q₂ = -2 μC separated by a distance of 0.5 m?"
              }
            ]
          },
          {
            category: "Statistics",
            icon: <SquareFunction className="h-4 w-4 mr-2" />,
            templates: [
              {
                name: "Mean & Variance",
                content: "How do I calculate the mean and variance of this data set?\n\n5, 7, 8, 12, 15, 18, 22"
              },
              {
                name: "Probability",
                content: "What is the probability of getting exactly 3 heads in 5 flips of a fair coin?"
              },
              {
                name: "Normal Distribution",
                content: "A variable follows a normal distribution with mean μ = 50 and standard deviation σ = 8. What is the probability of getting a value greater than 60?"
              }
            ]
          }
        ]
      },
      fr: {
        categories: [
          {
            category: "Algèbre",
            icon: <Calculator className="h-4 w-4 mr-2" />,
            templates: [
              {
                name: "Formule Quadratique",
                content: "Pour résoudre l'équation quadratique ax² + bx + c = 0, la formule est:\n\nx = (-b ± √(b² - 4ac)) / 2a\n\nPouvez-vous m'aider à résoudre cette équation: "
              },
              {
                name: "Systèmes Linéaires",
                content: "J'ai besoin d'aide pour résoudre ce système d'équations linéaires:\n\n3x + 2y = 7\n5x - y = 3\n\nQuelles sont les valeurs de x et y?"
              },
              {
                name: "Factorisation Polynomiale",
                content: "Comment factoriser cette expression polynomiale?\n\nx³ - 6x² + 11x - 6"
              }
            ]
          },
          {
            category: "Calcul",
            icon: <LineChart className="h-4 w-4 mr-2" />,
            templates: [
              {
                name: "Dérivée",
                content: "Pouvez-vous calculer la dérivée de cette fonction?\n\nf(x) = 3x⁵ - 2x³ + 5x - 7"
              },
              {
                name: "Intégrale",
                content: "J'ai besoin de calculer cette intégrale:\n\n∫ (x² + 3x - 2) dx"
              },
              {
                name: "Limites",
                content: "Comment évaluer cette limite?\n\nlim (x→2) (x³ - 8) / (x - 2)"
              }
            ]
          },
          {
            category: "Géométrie",
            icon: <Triangle className="h-4 w-4 mr-2" />,
            templates: [
              {
                name: "Aire d'un Triangle",
                content: "Comment calculer l'aire d'un triangle avec des côtés de longueur a = 5 cm, b = 7 cm, et c = 9 cm?"
              },
              {
                name: "Propriétés du Cercle",
                content: "Quelles sont les formules pour calculer la circonférence et l'aire d'un cercle de rayon r = 4 cm?"
              },
              {
                name: "Opérations Vectorielles",
                content: "Comment calculer le produit vectoriel de ces deux vecteurs?\n\nA = (3, -2, 5)\nB = (1, 4, -2)"
              }
            ]
          },
          {
            category: "Physique",
            icon: <Atom className="h-4 w-4 mr-2" />,
            templates: [
              {
                name: "Cinématique",
                content: "Un objet est lancé verticalement vers le haut avec une vitesse initiale de 20 m/s. Quelle hauteur maximale atteindra-t-il? (g = 9,8 m/s²)"
              },
              {
                name: "Lois de Newton",
                content: "Une force de 50 N est appliquée à un objet de 10 kg. Quelle est son accélération selon la deuxième loi de Newton?"
              },
              {
                name: "Électromagnétisme",
                content: "Comment calculer la force électrique entre deux charges ponctuelles q₁ = 3 μC et q₂ = -2 μC séparées par une distance de 0,5 m?"
              }
            ]
          },
          {
            category: "Statistiques",
            icon: <SquareFunction className="h-4 w-4 mr-2" />,
            templates: [
              {
                name: "Moyenne & Variance",
                content: "Comment calculer la moyenne et la variance de cet ensemble de données?\n\n5, 7, 8, 12, 15, 18, 22"
              },
              {
                name: "Probabilité",
                content: "Quelle est la probabilité d'obtenir exactement 3 faces sur 5 lancers d'une pièce équilibrée?"
              },
              {
                name: "Distribution Normale",
                content: "Une variable suit une distribution normale de moyenne μ = 50 et écart-type σ = 8. Quelle est la probabilité d'obtenir une valeur supérieure à 60?"
              }
            ]
          }
        ]
      },
      ar: {
        categories: [
          {
            category: "الجبر",
            icon: <Calculator className="h-4 w-4 mr-2" />,
            templates: [
              {
                name: "معادلة تربيعية",
                content: "لحل المعادلة التربيعية ax² + bx + c = 0، الصيغة هي:\n\nx = (-b ± √(b² - 4ac)) / 2a\n\nهل يمكنك مساعدتي في حل هذه المعادلة: "
              },
              {
                name: "أنظمة خطية",
                content: "أحتاج إلى مساعدة في حل نظام المعادلات الخطية هذا:\n\n3x + 2y = 7\n5x - y = 3\n\nما هي قيم x و y؟"
              },
              {
                name: "تحليل كثيرات الحدود",
                content: "كيف أقوم بتحليل هذه العبارة متعددة الحدود؟\n\nx³ - 6x² + 11x - 6"
              }
            ]
          },
          {
            category: "التفاضل والتكامل",
            icon: <LineChart className="h-4 w-4 mr-2" />,
            templates: [
              {
                name: "المشتقة",
                content: "هل يمكنك حساب مشتقة هذه الدالة؟\n\nf(x) = 3x⁵ - 2x³ + 5x - 7"
              },
              {
                name: "التكامل",
                content: "أحتاج إلى حساب هذا التكامل:\n\n∫ (x² + 3x - 2) dx"
              },
              {
                name: "النهايات",
                content: "كيف أقيّم هذه النهاية؟\n\nlim (x→2) (x³ - 8) / (x - 2)"
              }
            ]
          },
          {
            category: "الهندسة",
            icon: <Triangle className="h-4 w-4 mr-2" />,
            templates: [
              {
                name: "مساحة المثلث",
                content: "كيف أحسب مساحة مثلث بأطوال أضلاع a = 5 سم، b = 7 سم، و c = 9 سم؟"
              },
              {
                name: "خصائص الدائرة",
                content: "ما هي صيغ حساب محيط ومساحة دائرة نصف قطرها r = 4 سم؟"
              },
              {
                name: "عمليات المتجهات",
                content: "كيف أحسب الضرب المتجهي لهذين المتجهين؟\n\nA = (3, -2, 5)\nB = (1, 4, -2)"
              }
            ]
          },
          {
            category: "الفيزياء",
            icon: <Atom className="h-4 w-4 mr-2" />,
            templates: [
              {
                name: "علم الحركة",
                content: "تم قذف جسم رأسياً لأعلى بسرعة ابتدائية 20 م/ث. ما هو أقصى ارتفاع سيصل إليه؟ (g = 9.8 م/ث²)"
              },
              {
                name: "قوانين نيوتن",
                content: "تم تطبيق قوة 50 نيوتن على جسم كتلته 10 كجم. ما هو تسارعه وفقاً للقانون الثاني لنيوتن؟"
              },
              {
                name: "الكهرومغناطيسية",
                content: "كيف أحسب القوة الكهربائية بين شحنتين نقطيتين q₁ = 3 ميكروكولوم و q₂ = -2 ميكروكولوم تفصل بينهما مسافة 0.5 متر؟"
              }
            ]
          },
          {
            category: "الإحصاء",
            icon: <SquareFunction className="h-4 w-4 mr-2" />,
            templates: [
              {
                name: "المتوسط والتباين",
                content: "كيف أحسب المتوسط والتباين لهذه المجموعة من البيانات؟\n\n5, 7, 8, 12, 15, 18, 22"
              },
              {
                name: "الاحتمالات",
                content: "ما هو احتمال الحصول على 3 صور بالضبط في 5 رميات لعملة معدنية متوازنة؟"
              },
              {
                name: "التوزيع الطبيعي",
                content: "متغير يتبع توزيعاً طبيعياً بمتوسط μ = 50 وانحراف معياري σ = 8. ما هو احتمال الحصول على قيمة أكبر من 60؟"
              }
            ]
          }
        ]
      }
    };
  }, []);

  // Get the appropriate templates based on the current locale
  const mathTemplates = useMemo(() => {
    // Default to English if the locale is not supported
    return templatesByLanguage[locale] || templatesByLanguage.en;
  }, [locale, templatesByLanguage]);

  // Localized category names for the dropdown header
  const localizedCategoryLabel = useMemo(() => {
    const labels = {
      en: "Math & Physics Templates",
      fr: "Modèles Mathématiques et Physiques",
      ar: "قوالب الرياضيات والفيزياء"
    };
    return labels[locale] || labels.en;
  }, [locale]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-full"
          title={t("mathTemplates") || localizedCategoryLabel}
        >
          <Sigma className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
        <DropdownMenuLabel>{t("mathTemplates") || localizedCategoryLabel}</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {mathTemplates.categories.map((category: any, idx: any) => (
          <React.Fragment key={idx}>
            {idx > 0 && <DropdownMenuSeparator />}
            <DropdownMenuGroup>
              <DropdownMenuLabel className="flex items-center text-xs font-medium">
                {category.icon}
                {category.category}
              </DropdownMenuLabel>
              {category.templates.map((template: any, templateIdx: any)  => (
                <DropdownMenuItem
                  key={templateIdx}
                  className="cursor-pointer"
                  onClick={() => onSelectTemplate(template.content)}
                >
                  <span className="text-sm">{template.name}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </React.Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
