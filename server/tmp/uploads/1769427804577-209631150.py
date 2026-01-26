# Practical 6: Product Price with GST
# Question

import numpy as np
# Store prices of 5 products.
price = np.array([200,500,300,600,250])

# 1. Apply 18% GST using broadcasting
gst = price + (price * 0.18)

# 2. Display final prices
print(gst)

# 3. Find most expensive product price
print(np.max(gst))