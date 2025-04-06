"use client";

import React from 'react';
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
import { useTranslation } from '@/i18n/client';

interface MathTemplatesProps {
  onSelectTemplate: (template: string) => void;
}

export function MathTemplates({ onSelectTemplate }: MathTemplatesProps) {
  const { t } = useTranslation();

  const mathTemplates = [
    {
      category: "Algebra",
      icon: <Calculator className="h-4 w-4 mr-2" />,
      templates: [
        {
          name: "Quadratic Formula",
          content: "Pour résoudre l'équation quadratique ax² + bx + c = 0, la formule est:\n\nx = (-b ± √(b² - 4ac)) / 2a\n\nPouvez-vous m'aider à résoudre cette équation: "
        },
        {
          name: "Linear Systems",
          content: "J'ai besoin d'aide pour résoudre ce système d'équations linéaires:\n\n3x + 2y = 7\n5x - y = 3\n\nQuelles sont les valeurs de x et y?"
        },
        {
          name: "Polynomial Factoring",
          content: "Comment factoriser cette expression polynomiale?\n\nx³ - 6x² + 11x - 6"
        }
      ]
    },
    {
      category: "Calculus",
      icon: <LineChart className="h-4 w-4 mr-2" />,
      templates: [
        {
          name: "Derivative",
          content: "Pouvez-vous calculer la dérivée de cette fonction?\n\nf(x) = 3x⁵ - 2x³ + 5x - 7"
        },
        {
          name: "Integral",
          content: "J'ai besoin de calculer cette intégrale:\n\n∫ (x² + 3x - 2) dx"
        },
        {
          name: "Limits",
          content: "Comment évaluer cette limite?\n\nlim (x→2) (x³ - 8) / (x - 2)"
        }
      ]
    },
    {
      category: "Geometry",
      icon: <Triangle className="h-4 w-4 mr-2" />,
      templates: [
        {
          name: "Triangle Area",
          content: "Comment calculer l'aire d'un triangle avec des côtés de longueur a = 5 cm, b = 7 cm, et c = 9 cm?"
        },
        {
          name: "Circle Properties",
          content: "Quelles sont les formules pour calculer la circonférence et l'aire d'un cercle de rayon r = 4 cm?"
        },
        {
          name: "Vector Operations",
          content: "Comment calculer le produit vectoriel de ces deux vecteurs?\n\nA = (3, -2, 5)\nB = (1, 4, -2)"
        }
      ]
    },
    {
      category: "Physics",
      icon: <Atom className="h-4 w-4 mr-2" />,
      templates: [
        {
          name: "Kinematics",
          content: "Un objet est lancé verticalement vers le haut avec une vitesse initiale de 20 m/s. Quelle hauteur maximale atteindra-t-il? (g = 9.8 m/s²)"
        },
        {
          name: "Newton's Laws",
          content: "Une force de 50 N est appliquée à un objet de 10 kg. Quelle est son accélération selon la deuxième loi de Newton?"
        },
        {
          name: "Electromagnetism",
          content: "Comment calculer la force électrique entre deux charges ponctuelles q₁ = 3 μC et q₂ = -2 μC séparées par une distance de 0.5 m?"
        }
      ]
    },
    {
      category: "Statistics",
      icon: <SquareFunction className="h-4 w-4 mr-2" />,
      templates: [
        {
          name: "Mean & Variance",
          content: "Comment calculer la moyenne et la variance de cet ensemble de données?\n\n5, 7, 8, 12, 15, 18, 22"
        },
        {
          name: "Probability",
          content: "Quelle est la probabilité d'obtenir exactement 3 faces sur 5 lancers d'une pièce équilibrée?"
        },
        {
          name: "Normal Distribution",
          content: "Une variable suit une distribution normale de moyenne μ = 50 et écart-type σ = 8. Quelle est la probabilité d'obtenir une valeur supérieure à 60?"
        }
      ]
    }
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-full"
          title={t("mathTemplates") || "Math & Physics Templates"}
        >
          <Sigma className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel>{t("mathTemplates") || "Math & Physics Templates"}</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {mathTemplates.map((category, idx) => (
          <React.Fragment key={idx}>
            {idx > 0 && <DropdownMenuSeparator />}
            <DropdownMenuGroup>
              <DropdownMenuLabel className="flex items-center text-xs font-medium">
                {category.icon}
                {category.category}
              </DropdownMenuLabel>
              {category.templates.map((template, templateIdx) => (
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
