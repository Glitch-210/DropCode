# Practical 1: Student Marks Analysis
# Question

import numpy as np

# Store marks of 6 students in a NumPy array.
marks = np.array([70,80,77,86,75])

# 1. Display all marks
print(marks)

# 2. Find total and average marks
print(np.sum(marks))
print(np.mean(marks))

# 3. Find highest and lowest marks
print(np.max(marks))
print(np.min(marks))

# 4. Increase all marks by 5 using broadcasting
marks2 = marks + 5
print(marks2)