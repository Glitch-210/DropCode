# Practical 4: Temperature Monitoring System
# Question

import numpy as np
# Store temperature readings (°C) for 7 days.
temp = np.array([28, 30, 27, 32, 31, 29, 33])

# 1. Calculate average temperature
print(np.mean(temp))

# 2. Display temperatures above average
print(temp[np.mean(temp)< temp])

# 3. Find maximum and minimum temperature
print(np.max(temp))
print(np.min(temp))