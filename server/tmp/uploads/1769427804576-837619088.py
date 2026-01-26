# Practical 2: Monthly Sales Report
# Question

import numpy as np
# Store monthly sales (in thousands) for 12 months.
sales = np.array([45, 52, 48, 60, 55, 50, 62, 58, 47, 53, 49, 65])

# 1. Find total yearly sales
print(np.sum(sales))

# 2. Find average monthly sales
print(np.mean(sales))

# 3. Display sales for first 6 months
fist_six = sales[:6]
print(fist_six)

# 4. Identify months where sales exceeded 50
print(sales[sales>50])
