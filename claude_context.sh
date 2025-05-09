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

## Startup Context

**EdTech SaaS Platform for AI-Powered Tutoring**

We are developing a cutting-edge EdTech SaaS platform aimed at transforming the educational landscape by seamlessly integrating AI into the tutoring process. Our platform caters to individual students as well as educational institutions, providing valuable insights and operational support for professors, administrators, and parents.

### Key Features:
1. **AI-Powered Student Alignment**:
   - Our intelligent AI system personalizes the learning experience, aligning students with their educational goals and adapting to their unique learning styles.
   - Students are paired with tailored AI tutors that enhance their understanding in specific subjects, ultimately improving learning outcomes.

2. **Real-Time Feedback & Recommendations**:
   - Professors and administrators can track student interactions with the AI tutor, receiving data-driven insights into each student's strengths and areas for growth.
   - The AI offers targeted recommendations for students to focus on in physical school settings, effectively bridging the gap between digital and traditional learning environments.

3. **Professors & Administrators’ Insight**:
   - Professors can access comprehensive reports on student progress, with AI-generated suggestions on how to provide optimal support for each learner.
   - Administrators benefit from insights into overall student performance trends, empowering them to enhance educational outcomes at the institutional level.

4. **Parental Engagement**:
   - Parents receive tailored updates and actionable insights from the AI system regarding their child's learning journey, enabling them to actively support their child's academic progress.

### How it Works:
- **For Students**: The AI tutor evolves with each interaction, continuously refining its support to meet the student's needs.
- **For Professors & Admin**: The AI aggregates data from student interactions to generate insightful reports, guiding educators on areas that require attention.
- **For Parents**: The platform offers a transparent view of their child’s progress, fostering active parental involvement in the educational process.

Our mission is to **elevate education** by making learning more personalized, efficient, and accessible for all stakeholders involved.

### Design and User Interface Goals:
- **Elegance and Simplicity**: The UI should be clean, intuitive, and visually appealing, ensuring a seamless user experience for students, educators, and parents.
- **Professional Aesthetic**: The design should reflect a modern educational environment, instilling confidence and trust in users.
- **Responsive Design**: The platform must be fully responsive, providing an optimal experience across devices, from desktops to tablets and smartphones.
- **User -Centric Navigation**: The interface should prioritize ease of navigation, allowing users to quickly access features and insights relevant to their roles.

---

EOT
