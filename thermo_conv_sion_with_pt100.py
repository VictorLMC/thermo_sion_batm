# -*- coding: utf-8 -*-
"""
Created on Thu Jan  7 14:40:12 2021

@author: manip.batm
"""

import numpy as np
import matplotlib.pyplot as plt
import csv


#%% READING OF THE DATA

# RuO2 table from Arpit
ruo2 = csv.reader(open("ruo2_csv.csv")) # Open the CSV file
ruo2_temp = np.array([]) # Empty array for the temperature values
ruo2_res = np.array([]) # Empty array for the resistance values
k=0 # Counter to discard the first line (special character, and same res value as 2nd line)

for row in ruo2:
    if k!=0: # If it's not the 1st line
        row_split = (row[0]).split(';')
        ruo2_temp = np.append(ruo2_temp, float(row_split[0]))
        ruo2_res = np.append(ruo2_res, float(row_split[1]))
    k+=1

# C47 table from Clément
c47 = csv.reader(open("c47_csv.csv"))
c47_temp = np.array([])
c47_res = np.array([])
k=0

for row in c47:
    if k!=0:
        row_split = (row[0]).split(';')
        c47_temp = np.append(c47_temp, float(row_split[0]))
        c47_res = np.append(c47_res, float(row_split[1]))
    k+=1

#%% SEPARATE PROCESSING OF THE COLDEST TEMPERATURES (not in the C47 table)
"""
Under the minimum temperature of the C47 table, we consider C47 negligible,
and keep only the RuO2 contribution. In the end of the script, we append
the RuO2 only data for low temperatures, and the interpolated data between
RuO2 and C47.
"""
ruo2_only_temp = np.array([])
ruo2_only_res = np.array([])
ruo2_interp_temp = np.array([])
ruo2_interp_res = np.array([])

c47_min_temp = c47_temp[0]
c47_max_temp = c47_temp[-1]
for i in range(len(ruo2_temp)):
    t = ruo2_temp[i]
    r = ruo2_res[i]
    if t < c47_min_temp:
        # Append RuO2 temp and res values to the RuO2 only arrays
        ruo2_only_temp = np.append(ruo2_only_temp, t)
        ruo2_only_res = np.append(ruo2_only_res, r)
    elif t < c47_max_temp:
        ruo2_interp_temp = np.append(ruo2_interp_temp, t)
        ruo2_interp_res = np.append(ruo2_interp_res, r)


#%% LINEAR INTERPOLATION OF C47 TABLE AT RuO2 TEMPERATURES

n = len(ruo2_interp_temp)
nc = len(c47_temp)
c47_interp_res = np.zeros(n)

for i in range(n):
    k=0 # Counter that will give the position of the interpolation interval
    ruo2_temp_curr = ruo2_interp_temp[i]
    ruo2_res_curr = ruo2_interp_res[i]
    # Search of interval of C47 temp containing the current Ruo2 temp
    while (c47_temp[k] < ruo2_temp_curr) and (k < nc-1):
        k+=1
    # Computation of the interpolated C47 resistance value
    x = (ruo2_temp_curr - c47_temp[k-1])/(c47_temp[k] - c47_temp[k-1])
    if x<1: # The 2 last tem
        r = x*c47_res[k-1] + (1-x)*c47_res[k]
    # Append the new values to the arrays of interpolated values
    c47_interp_res[i] = r

#%% COMPUTATION OF RESISTANCE VALUES FOR THE C47-RuO2 MIX AND MERGING OF THE DATA

mix_temp = np.append(ruo2_only_temp, ruo2_interp_temp)
mix_interp_res = 1/(1/ruo2_interp_res + 1/c47_interp_res)
mix_res = np.append(ruo2_only_res, mix_interp_res)


#%% ADDING OF Pt100 VALUES BASED ON FORMULAS IN MMR3 DOC (http://elec.neel.cnrs.fr/macrt/index.php?pg=convers)

R0 = 100.
a = 0.00385*R0
# Conversion formula from MMR3 doc
pt100_res = (mix_temp-R0)/a + 273.15
# Merging of Ruo2+C47 data with Pt100 data
mix_res_with_pt100 = 1/(1/mix_res+1/pt100_res)

#%% DATA WRITING INTO CSV FILE

with open('mix_csv_with_pt100.csv', 'w', newline='') as csvfile:
    mix = csv.writer(csvfile, delimiter=';')
    for i in range(len(mix_temp)):
        mix.writerow([str(mix_temp[i]), str(mix_res_with_pt100[i])])
