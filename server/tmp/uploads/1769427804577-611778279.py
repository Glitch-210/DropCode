# Practical 5: Daily Expense Tracker
# Question

import numpy as np
# Store daily expenses for one week.
expenses = np.array([700,450,850,800,350,400,500])

# 1. Calculate total expense
print(np.sum(expenses))

# 2. Calculate average expense
print(np.mean(expenses))


# 3. Display expenses greater than 500
print(expenses[expenses>500])