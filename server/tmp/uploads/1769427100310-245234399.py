# Practical 9: Sensor Data Analysis
# Question

import numpy as np
# Store sensor readings.
readings = np.array([45, 78, 102, 60, 150, 85, 95, 110])

# 1. Remove readings above 100
print(readings[readings <= 100])

# 2. Calculate cumulative readings
print(np.cumsum(readings[readings <= 100]))
