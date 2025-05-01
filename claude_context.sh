#!/bin/bash

# Clear claude_context.txt before starting (optional, if you want a fresh file each time)
> claude_context.txt

# Find all .py files in db/models directory and save their names and content
find backend/src/db/models -name "*.py" -exec sh -c 'echo "File: {}" >> claude_context.txt; cat {} >> claude_context.txt; echo "\n" >> claude_context.txt' \;

# Save the directory trees
tree backend/src/ >> claude_context.txt
tree web/src/ >> claude_context.txt

# Append startup context to the bottom
cat <<EOT >> claude_context.txt

---
## Startup Context

**EdTech SaaS Platform for AI-Powered Tutoring**

We are building an innovative EdTech startup SaaS designed to revolutionize education by **integrating AI into the tutoring process**. This platform targets students individually, as well as through schools, and provides operations and insights for **professors, administrators, and parents**.

### Key Features:
1. **AI-Powered Student Alignment**:
   - AI helps students align with their educational goals, assist them with learning, and tailor their study experience to their unique needs.
   - Students are connected to personalized AI tutors that help them in specific subjects, fostering a deeper understanding and improving learning outcomes.

2. **Real-Time Feedback & Recommendations**:
   - Professors and administrators can monitor student interactions with the AI tutor. The system provides data-driven insights into each student's strengths and areas for improvement.
   - AI suggests specific areas for students to focus on in **physical school settings**, helping bridge the gap between digital and physical learning.

3. **Professors & Administrators’ Insight**:
   - Professors can analyze detailed reports of student progress and receive suggestions from AI on how to better support each student.
   - Administrators gain insights into overall student performance trends, helping them improve educational outcomes at a school-wide level.

4. **Parental Engagement**:
   - Parents receive personalized updates and suggestions from the AI system about their child's learning journey, giving them actionable insights to support their child’s academic progress.

### How it Works:
- **For Students**: The AI tutor learns from each interaction, continuously improving the way it supports the student.
- **For Professors & Admin**: The AI collects data from student interactions and uses it to generate reports, offering professors specific guidance on areas that require attention.
- **For Parents**: The platform gives parents a transparent view of their child’s progress, ensuring they can actively participate in their educational journey.

With this model, the goal is to **level up education**, making learning more personalized, efficient, and accessible to all stakeholders involved.

EOT
