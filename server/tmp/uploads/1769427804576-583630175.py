# Practical 3: Employee Salary Increment
# Question

import numpy as np
# Store salaries of 5 employees.
salaries = np.array([25000, 32000, 28000, 40000, 35000])

# 1. Display original salaries
print("salaries", salaries)

# 2. Apply 10% salary increment using broadcasting
print(salaries + (salaries * 0.10))
print(salaries + (salaries - 0.10))

# 3. Find highest and lowest salary
print(np.max(salaries))
print(np.min(salaries))


