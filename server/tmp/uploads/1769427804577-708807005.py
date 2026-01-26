# Practical 7: Attendance Analysis
# Question

import numpy as np
# Store attendance percentage of 8 students.
attendance = np.array([82, 74, 90, 68, 76, 55, 88, 70])

# 1. Count students having attendance ≥ 75%
print(np.sum([attendance >= 75]))

# 2. Display attendance below 75%
print(attendance[attendance <= 75])
