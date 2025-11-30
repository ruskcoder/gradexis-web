import React, { useEffect, useState } from 'react'
import { Spinner } from '@/components/ui/spinner'
import { Button } from '@/components/ui/button'
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@/components/ui/tabs"
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from "@/components/ui/resizable"
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table"
import { useCurrentUser, useStore } from '@/lib/store'
import { getTranscript } from '@/lib/grades-api'
import { Input } from '@/components/ui/input'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"
import { Trash2, Plus, Paperclip } from 'lucide-react'
import { GPA_CONFIGS } from '@/lib/GPAConfigs'

export default function GPARankCalculator() {
	const [loading, setLoading] = useState(true)
	const [transcriptData, setTranscriptData] = useState(null)
	const [gpaType, setGpaType] = useState('katyWeighted')
	const [customCourses, setCustomCourses] = useState([])
	const [courseTypes, setCourseTypes] = useState({})
	const [currentGPA, setCurrentGPA] = useState(null)
	const [deletedTranscriptCourses, setDeletedTranscriptCourses] = useState(new Set())
	const [rankDataPoints, setRankDataPoints] = useState([
		{ gpa: null, rank: null, id: 1 },
		{ gpa: null, rank: null, id: 2 }
	])
	const [userRankGPA, setUserRankGPA] = useState('')
	const [currentRank, setCurrentRank] = useState(null)
	const [classSize, setClassSize] = useState(null)
	const tableRef = React.useRef(null)

	const user = useCurrentUser()
	const showTitle = user ? user.showPageTitles !== false : true

	const getGPATypeFromDistrict = () => {
		if (user?.district && user.district.includes('Cypress')) {
			return 'cyFairWeighted'
		}
		return 'katyWeighted'
	}

	useEffect(() => {
		const districtGpaType = getGPATypeFromDistrict()
		setGpaType(districtGpaType)
	}, [user?.district])

	// === GPA Calculation System ===
	
	const getConfig = () => GPA_CONFIGS[gpaType]

	const getCourseTypesFromConfig = () => {
		const config = getConfig()
		return config?.classes ? Object.keys(config.classes).filter(key => !key.startsWith('*')) : []
	}

	const getGradeLabel = (gradeValue) => {
		const config = getConfig()
		if (!config?.labels) return null

		for (const [label, range] of Object.entries(config.labels)) {
			const [min, max] = range.split('-').map(Number)
			if (gradeValue >= min && gradeValue <= max) return label
		}
		return null
	}

	const getGradePoints = (gradeLabel, courseType) => {
		const config = getConfig()
		if (!config?.classes || !gradeLabel) return null

		// Determine which class key to use
		const classKey = 
			config.classes[courseType] ? courseType :
			config.classes['*'] ? '*' :
			Object.keys(config.classes).find(key => courseType?.includes(key)) || null

		if (!classKey) return null

		return config.classes[classKey]?.[gradeLabel] ?? null
	}

	const calculateCourseGPA = (gradeValue, courseType) => {
		const gradeLabel = getGradeLabel(gradeValue)
		const gpaPoints = gradeLabel ? getGradePoints(gradeLabel, courseType) : null
		return gpaPoints !== null ? Math.max(0, Math.round(gpaPoints * 100) / 100) : null
	}

	const detectCourseType = (courseName) => {
		const types = getCourseTypesFromConfig()
		const detected = types.find(type => courseName.includes(type))
		
		if (detected) return detected
		if (types.length === 0) return null
		return types[0]
	}

	// === Transcript Data Processing ===

	const parseTranscriptCourse = (courseCode, courseName, gradeValue, semesterKey, courseTypeOverride) => {
		const courseType = courseTypeOverride || detectCourseType(courseName)
		const gradeNum = parseFloat(gradeValue)
		const gpa = calculateCourseGPA(gradeNum, courseType)
		
		return {
			courseName,
			courseCode,
			uniqueId: `${courseName}_${courseCode}_${semesterKey}`,
			semester: semesterKey.split(' - ')[1],
			year: parseInt(semesterKey.split(' - ')[0]) || 0,
			grade: gradeValue,
			type: courseType,
			gpa,
			isDeleted: false
		}
	}

	const getTableData = () => {
		if (!transcriptData?.transcriptData) return []

		const allCourses = []
		
		for (const semesterKey in transcriptData.transcriptData) {
			const semester = transcriptData.transcriptData[semesterKey]
			if (!semester.data || !Array.isArray(semester.data)) continue

			const headerRow = semester.data[0]
			const gradeIndex = headerRow.includes('S1') ? headerRow.indexOf('S1') : headerRow.indexOf('S2')

			for (let i = 1; i < semester.data.length; i++) {
				const row = semester.data[i]
				if (!row.length) continue

				const courseTypeOverride = courseTypes[`${row[1]}_${row[0]}_${semesterKey}`] || user?.courseTypesByCourseName?.[row[1]]
				const course = parseTranscriptCourse(row[0], row[1], row[gradeIndex], semesterKey, courseTypeOverride)
				course.isDeleted = deletedTranscriptCourses.has(course.uniqueId)
				
				allCourses.push(course)
			}
		}

		return allCourses.sort((a, b) => 
			b.year !== a.year ? b.year - a.year :
			a.courseName !== b.courseName ? a.courseName.localeCompare(b.courseName) :
			a.semester.localeCompare(b.semester)
		)
	}

	// === Custom Course Management ===

	const parseGradeInput = (input) => {
		const num = parseFloat(input)
		if (!isNaN(num) && num >= 0 && num <= 100) return num
		const letterMap = { A: 95, B: 85, C: 75, D: 65, F: 50 }
		return letterMap[input.toUpperCase()] || null
	}

	const addCourse = () => {
		const newCourse = { 
			id: Date.now(), 
			courseName: '', 
			grade: '', 
			type: getCourseTypesFromConfig()[0] || 'Regular', 
			gpa: null 
		}
		const updated = [newCourse, ...customCourses]
		setCustomCourses(updated)
		saveCustomCoursesToStore(updated)
		
		setTimeout(() => tableRef.current?.scrollTo(0, 0), 0)
	}

	const deleteCourse = (id) => {
		const updated = customCourses.filter(c => c.id !== id)
		setCustomCourses(updated)
		saveCustomCoursesToStore(updated)
	}

	const updateCustomCourse = (id, field, value) => {
		const updated = customCourses.map(course => {
			if (course.id !== id) return course
			
			const updated = { ...course, [field]: value }
			
			if (field === 'grade' && value) {
				const gradeNum = parseGradeInput(value)
				updated.gpa = gradeNum !== null ? calculateCourseGPA(gradeNum, updated.type) : null
			} else if (field === 'type' && course.grade) {
				const gradeNum = parseGradeInput(course.grade)
				updated.gpa = gradeNum !== null ? calculateCourseGPA(gradeNum, value) : null
			}
			
			return updated
		})
		setCustomCourses(updated)
		saveCustomCoursesToStore(updated)
	}

	const saveCustomCoursesToStore = (courses) => {
		useStore.getState().changeUserData('customCourses', 
			courses.map(({ courseName, grade, type }) => ({ courseName, grade, type }))
		)
	}

	// === Course Type Management ===

	const updateTypeForCourseName = (courseName, newType) => {
		const changeUserData = useStore.getState().changeUserData
		const currentUser = useStore.getState().currentUser()
		
		if (currentUser) {
			changeUserData('courseTypesByCourseName', { 
				...currentUser.courseTypesByCourseName, 
				[courseName]: newType 
			})
		}

		setCourseTypes(prev => {
			const updated = { ...prev }
			Object.keys(updated).forEach(id => {
				if (id.startsWith(`${courseName}_`)) updated[id] = newType
			})
			return updated
		})

		setCustomCourses(prev => prev.map(course => 
			course.courseName === courseName 
				? { 
					...course, 
					type: newType,
					gpa: course.grade ? calculateCourseGPA(parseGradeInput(course.grade), newType) : null 
				}
				: course
		))
	}

	const deleteTranscriptCourse = (uniqueId) => {
		const newDeleted = new Set([...deletedTranscriptCourses, uniqueId])
		setDeletedTranscriptCourses(newDeleted)
		useStore.getState().changeUserData('deletedTranscriptCourses', Array.from(newDeleted))
	}

	const restoreTranscriptCourse = (uniqueId) => {
		const newDeleted = new Set(deletedTranscriptCourses)
		newDeleted.delete(uniqueId)
		setDeletedTranscriptCourses(newDeleted)
		useStore.getState().changeUserData('deletedTranscriptCourses', Array.from(newDeleted))
	}

	// === GPA Display ===

	const getCurrentGPA = () => {
		if (!currentGPA) return 0
		return gpaType === 'katyWeighted' || gpaType === 'cyFairWeighted' 
			? currentGPA.weighted || 0 
			: currentGPA.unweighted || 0
	}

	const getPredictedGPA = () => {
		// Return transcript's native GPA if no modifications
		if ((gpaType === 'katyWeighted' || gpaType === 'cyFairWeighted') && 
			customCourses.length === 0 && 
			deletedTranscriptCourses.size === 0 && 
			currentGPA?.weighted) {
			return currentGPA.weighted
		}
		
		const transcriptCourses = getTableData().filter(c => !c.isDeleted && c.gpa !== null)
		const customCoursesList = customCourses.filter(c => c.gpa !== null)
		const allCourses = [...transcriptCourses, ...customCoursesList]
		
		if (allCourses.length === 0) return 0
		
		const sum = allCourses.reduce((acc, c) => acc + c.gpa, 0)
		return Math.round((sum / allCourses.length) * 10000) / 10000
	}

	// === Rank Prediction ===

	const linearRegression = (points) => {
		const validPoints = points.filter(p => p.gpa !== null && p.gpa !== undefined && p.rank !== null && p.rank !== undefined)
		if (validPoints.length < 2) return null

		const n = validPoints.length
		const sumX = validPoints.reduce((sum, p) => sum + p.gpa, 0)
		const sumY = validPoints.reduce((sum, p) => sum + p.rank, 0)
		const sumXY = validPoints.reduce((sum, p) => sum + p.gpa * p.rank, 0)
		const sumX2 = validPoints.reduce((sum, p) => sum + p.gpa * p.gpa, 0)

		const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
		const intercept = (sumY - slope * sumX) / n

		return { slope, intercept }
	}

	const predictRank = (gpa) => {
		const regression = linearRegression(rankDataPoints)
		if (!regression) return null
		const predicted = regression.slope * gpa + regression.intercept
		return Math.max(1, Math.round(predicted))
	}

	// === Rank Data Management ===

	const saveRankDataPointsToStore = (points) => {
		useStore.getState().changeUserData('rankDataPoints', 
			points.map(({ gpa, rank }) => ({ gpa, rank }))
		)
	}

	const updateRankDataPoint = (id, field, value) => {
		const updated = rankDataPoints.map(point =>
			point.id === id
				? { ...point, [field]: value ? parseFloat(value) : null }
				: point
		)
		setRankDataPoints(updated)
		saveRankDataPointsToStore(updated)
	}

	const addRankDataPoint = () => {
		const newId = Math.max(...rankDataPoints.map(p => p.id), 0) + 1
		const updated = [...rankDataPoints, { gpa: null, rank: null, id: newId }]
		setRankDataPoints(updated)
		saveRankDataPointsToStore(updated)
	}

	const deleteRankDataPoint = (id) => {
		if (rankDataPoints.length <= 1) return
		const updated = rankDataPoints.filter(point => point.id !== id)
		setRankDataPoints(updated)
		saveRankDataPointsToStore(updated)
	}

	// === Utility Functions ===

	const parseRankString = (rankStr) => {
		if (!rankStr) return { rank: null, classSize: null }
		const [rank, size] = rankStr.split('/')
		return {
			rank: rank ? parseInt(rank.trim()) || null : null,
			classSize: size ? parseInt(size.trim()) || null : null
		}
	}

	const useePredictedGPAForRank = () => {
		setUserRankGPA(getPredictedGPA().toString())
	}

	useEffect(() => {
		const fetchTranscript = async () => {
			try {
				setLoading(true)
				const data = await getTranscript()
				setTranscriptData(data)

				if (data.transcriptData) {
					const weightedGPA = data.transcriptData['Weighted GPA*'] || data['Weighted GPA*']
					const unweightedGPA = data.transcriptData['Unweighted GPA*'] || data['Unweighted GPA*']

					if (weightedGPA || unweightedGPA) {
						setCurrentGPA({
							weighted: weightedGPA ? parseFloat(weightedGPA) : null,
							unweighted: unweightedGPA ? parseFloat(unweightedGPA) : null
						})
					}

					if (data.transcriptData.rank) {
						const { rank, classSize } = parseRankString(data.transcriptData.rank)
						setCurrentRank(rank)
						setClassSize(classSize)
					}
				}

				if (user?.courseTypesByCourseName) {
					const initializedTypes = { ...user.courseTypesByCourseName }
					setCourseTypes(initializedTypes)
				}

				if (user?.deletedTranscriptCourses && user.deletedTranscriptCourses.length > 0) {
					setDeletedTranscriptCourses(new Set(user.deletedTranscriptCourses))
				}

				if (user?.customCourses && user.customCourses.length > 0) {
					const storedCourses = user.customCourses.map(course => {
						let calculatedGpa = null
						if (course.grade) {
							const gradeNum = parseGradeInput(course.grade)
							if (gradeNum !== null) {
								calculatedGpa = calculateCourseGPA(gradeNum, course.type)
							}
						}
						return {
							id: Date.now() + Math.random(),
							courseName: course.courseName,
							grade: course.grade,
							type: course.type,
							gpa: calculatedGpa
						}
					})
					setCustomCourses(storedCourses)
				}

				if (user?.rankDataPoints && user.rankDataPoints.length > 0) {
					const storedDataPoints = user.rankDataPoints.map((point, index) => ({
						id: index + 1,
						gpa: point.gpa,
						rank: point.rank
					}))
					setRankDataPoints(storedDataPoints)
				}
			} catch (error) {
				console.error('Failed to fetch transcript:', error)
			} finally {
				setLoading(false)
			}
		}

		fetchTranscript()
	}, [])

	return (
		<div className="space-y-8 flex flex-col">
			{showTitle && <h1 className="text-4xl font-bold">GPA & Class Rank</h1>}

			<ResizablePanelGroup direction="horizontal" className="space-x-2">
				<ResizablePanel className="relative bg-card rounded-xl border flex flex-col min-w-[400px]">
					{loading && (
						<div className="absolute inset-0 bg-card/85 flex items-center justify-center z-50 rounded-xl">
							<Spinner className="size-8" />
						</div>
					)}

					<div className='flex items-center justify-between py-2 px-4 border-b'>
						<div className='text-center text-sm font-medium text-muted-foreground flex-1 py-1'>
							GPA
						</div>
					</div>

				<div className="p-2 space-y-4 flex-1 overflow-y-auto">
					<div className="flex gap-2">
						<Button
							variant="outline"
							onClick={() => setGpaType(user?.district && user.district.includes('Cypress') ? 'cyFairWeighted' : 'katyWeighted')}
							className={`flex-1 ${(gpaType === 'katyWeighted' || gpaType === 'cyFairWeighted') ? 'border-primary hover:bg-primary/90 hover:border-primary hover:text-primary-foreground bg-primary text-primary-foreground' : ''}`}
						>
							Weighted - {user?.district && user.district.includes('Cypress') ? 'Cypress' : 'Katy'} ISD
						</Button>
						<Button
							variant="outline"
							onClick={() => setGpaType('unweighted')}
							className={`flex-1 ${gpaType === 'unweighted' ? 'border-primary hover:bg-primary/90 hover:border-primary hover:text-primary-foreground bg-primary text-primary-foreground' : ''}`}
						>
							Unweighted
						</Button>
						<Button
							variant="outline"
							disabled
							className="flex-1"
						>
							Custom
						</Button>
					</div>						{!loading && getTableData().length > 0 && (
							<div className="flex flex-col gap-2 w-full">
								<div className="border rounded-lg overflow-y-auto" style={{ maxHeight: '250px' }} ref={tableRef}>
									<Table className="w-full">
										<TableHeader className="sticky top-0 bg-background">
											<TableRow>
												<TableHead className="">Type</TableHead>
												<TableHead className="w-full">Course Name</TableHead>
												<TableHead className="min-w-[70px]">Grade</TableHead>
												<TableHead className="min-w-[60px]">GPA</TableHead>
												<TableHead className="w-12"></TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{customCourses.map((course) => (
												<TableRow key={course.id}>
													<TableCell className="max-w-[120px]">
														<Select
															value={course.type}
															onValueChange={(value) => updateTypeForCourseName(course.courseName, value)}
															disabled={gpaType === 'unweighted'}
														>
															<SelectTrigger className="h-8">
																<SelectValue />
															</SelectTrigger>
														<SelectContent>
															{getCourseTypesFromConfig().map(type => (
																<SelectItem key={type} value={type}>{type}</SelectItem>
															))}
														</SelectContent>
													</Select>
												</TableCell>
												<TableCell>
													<Input
														type="text"
														placeholder="Course Name"
														value={course.courseName}
															onChange={(e) => updateCustomCourse(course.id, 'courseName', e.target.value)}
															className="h-8"
														/>
													</TableCell>
													<TableCell className="max-w-[120px]">
														<Input
															type="text"
															placeholder="95"
															value={course.grade}
															onChange={(e) => updateCustomCourse(course.id, 'grade', e.target.value)}
															className="h-8"
														/>
													</TableCell>
													<TableCell className="max-w-[120px]">{course.gpa?.toFixed(2) || '-'}</TableCell>
													<TableCell className="w-12">
														<Button
															size="sm"
															variant="outline"
															className='h-8 w-8 p-0 text-black hover:text-red-600 hover:bg-red-100'
															onClick={() => deleteCourse(course.id)}
														>
															<Trash2 size={16} />
														</Button>
													</TableCell>
												</TableRow>
											))}
											{getTableData().map((row, index) => (
												<TableRow key={row.uniqueId} className={row.isDeleted ? 'opacity-60' : ''}>
													<TableCell className={`max-w-[120px] ${row.isDeleted ? 'line-through' : ''}`}>
														<Select
															value={courseTypes[row.uniqueId] || row.type}
															onValueChange={(value) => {
																updateTypeForCourseName(row.courseName, value)
															}}
															disabled={gpaType === 'unweighted' || row.isDeleted}
														>
															<SelectTrigger className="h-8">
																<SelectValue />
															</SelectTrigger>
														<SelectContent>
															{getCourseTypesFromConfig().map(type => (
																<SelectItem key={type} value={type}>{type}</SelectItem>
															))}
														</SelectContent>
													</Select>
												</TableCell>
												<TableCell className={`font-medium ${row.isDeleted ? 'line-through' : ''}`}>{row.courseName}</TableCell>
													<TableCell className={`max-w-[120px] ${row.isDeleted ? 'line-through' : ''}`}>{row.grade}</TableCell>
													<TableCell className={`max-w-[120px] ${row.isDeleted ? 'line-through' : ''}`}>{row.gpa?.toFixed(2) || '-'}</TableCell>
													<TableCell className="w-12">
														{row.isDeleted ? (
															<Button
																size="sm"
																variant="outline"
																className='h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-100'
																onClick={() => restoreTranscriptCourse(row.uniqueId)}
																title="Restore course"
															>
																<svg width={16} height={16} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
																	<polyline points="23 4 23 10 17 10"></polyline>
																	<polyline points="1 20 1 14 7 14"></polyline>
																	<path d="M3.51 9a9 9 0 0 1 14.85-3.36M20.49 15a9 9 0 0 1-14.85 3.36"></path>
																</svg>
															</Button>
														) : (
															<Button
																size="sm"
																variant="outline"
																className='h-8 w-8 p-0 text-black hover:text-red-600 hover:bg-red-100'
																onClick={() => deleteTranscriptCourse(row.uniqueId)}
															>
																<Trash2 size={16} />
															</Button>
														)}
													</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								</div>

								<Button
									variant="outline"
									className="w-full"
									onClick={addCourse}
								>
									<Plus size={16} className="mr-1" />
									Add Course
								</Button>

								<div className="grid grid-cols-2 gap-4 w-full mt-2">
									<div
										className="bg-blue-100 dark:bg-blue-900 rounded-lg p-4 border border-blue-300 dark:border-blue-700"
									>
										<p className="text-xs text-blue-700 dark:text-blue-200 font-medium mb-2">Current GPA</p>
										<p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{getCurrentGPA().toFixed(4)}</p>
									</div>

									<div
										className="bg-purple-100 dark:bg-purple-900 rounded-lg p-4 border border-purple-300 dark:border-purple-700 flex flex-col"
									>
										<p className="text-xs text-purple-700 dark:text-purple-200 font-medium mb-2">Predicted GPA</p>
										<div className="flex items-center gap-2">
											<p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{getPredictedGPA().toFixed(4)}</p>
											{(() => {
												const currentGPA = getCurrentGPA()
												const predictedGPA = getPredictedGPA()
												const change = predictedGPA - currentGPA
												let badgeColor = 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200'

												if (change > 0.01) {
													badgeColor = 'bg-green-200 text-green-700 dark:bg-green-900 dark:text-green-200'
												} else if (change < -0.01) {
													badgeColor = 'bg-red-200 text-red-700 dark:bg-red-900 dark:text-red-200'
												}

												return (
													<span className={`text-sm font-semibold px-2.5 py-1 rounded ${badgeColor}`}>
														{change > 0 ? '+' : ''}{change.toFixed(4)}
													</span>
												)
											})()}
										</div>
									</div>
								</div>
							</div>
						)}
					</div>
				</ResizablePanel>

				<ResizableHandle className="bg-border hover:bg-accent/50" />

				<ResizablePanel className="relative bg-card rounded-xl border flex flex-col min-w-[400px]">
					{loading && (
						<div className="absolute inset-0 bg-card/85 flex items-center justify-center z-50 rounded-xl">
							<Spinner className="size-8" />
						</div>
					)}

					<div className='flex items-center justify-between py-2 px-4 border-b'>
						<div className='text-center text-sm font-medium text-muted-foreground flex-1 py-1'>
							Rank
						</div>
					</div>

					<div className="p-4 flex-1 overflow-y-auto space-y-4">
						{ }
						<div className="space-y-2">
							<label className="text-sm font-medium">Enter some known GPA's and Ranks</label>
							<div className="border rounded-lg overflow-x-auto max-h-48 overflow-y-auto mt-1">
								<Table className="text-sm">
									<TableHeader>
										<TableRow>
											<TableHead className="w-1/2">GPA</TableHead>
											<TableHead className="w-1/2">Rank</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{rankDataPoints.map((point) => (
											<TableRow key={point.id}>
												<TableCell>
													<Input
														type="number"
														placeholder="e.g., 3.8"
														value={point.gpa ?? ''}
														onChange={(e) => updateRankDataPoint(point.id, 'gpa', e.target.value)}
														className="h-8 text-xs"
														step="0.01"
														min="0"
														max="5"
													/>
												</TableCell>
												<TableCell>
													<div className="flex gap-1">
														<Input
															type="number"
															placeholder="e.g., 15"
															value={point.rank ?? ''}
															onChange={(e) => updateRankDataPoint(point.id, 'rank', e.target.value)}
															className="h-8 text-xs"
															min="1"
														/>
														{rankDataPoints.length > 1 && (
															<Button
																size="sm"
																variant="ghost"
																className="h-8 w-8 p-0"
																onClick={() => deleteRankDataPoint(point.id)}
															>
																<Trash2 size={14} />
															</Button>
														)}
													</div>
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</div>
							<Button
								variant="outline"
								className="w-full text-xs h-8"
								onClick={addRankDataPoint}
							>
								<Plus size={14} className="mr-1" />
								Add Data Point
							</Button>
						</div>

						<div className="space-y-2 border-t pt-2">
							<label className="text-sm font-medium">Your GPA</label>
							<div className="flex gap-1 mt-1">
								<Input
									type="number"
									placeholder="Enter your GPA"
									value={userRankGPA}
									onChange={(e) => setUserRankGPA(e.target.value)}
									className="h-9 text-sm"
								/>
								<Button
									size="sm"
									variant="outline"
									onClick={useePredictedGPAForRank}
									title="Use Predicted GPA"
									className="px-2 h-9"
								>
									<Paperclip size={16} />
								</Button>
							</div>
						</div>

						<div className="grid grid-cols-2 gap-2 border-t pt-4">
							<div className="bg-amber-100 dark:bg-amber-900 rounded-lg p-3 border border-amber-300 dark:border-amber-700">
								<p className="text-xs text-amber-700 dark:text-amber-200 font-medium mb-1">Current Rank</p>
								<p className="text-xl font-bold text-amber-900 dark:text-amber-100 mb-1">
									{currentRank ? `${currentRank} / ${classSize || '--'}` : '--'}
								</p>
							</div>

							<div className="bg-orange-100 dark:bg-orange-900 rounded-lg p-3 border border-orange-300 dark:border-orange-700 flex flex-col">
								<p className="text-xs text-orange-700 dark:text-orange-200 font-medium mb-1">Predicted Rank</p>
								<div className="flex items-center gap-1">
									<p className="text-xl font-bold text-orange-900 dark:text-orange-100">
										{userRankGPA ? (predictRank(parseFloat(userRankGPA)) + " / " + classSize || '--') : '--'}
									</p>
									{(() => {
										if (!userRankGPA || !currentRank) return null
										const predictedRank = predictRank(parseFloat(userRankGPA))
										if (!predictedRank) return null
										const change = currentRank - predictedRank
										let badgeColor = 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200'

										if (change > 0) {
											badgeColor = 'bg-green-200 text-green-700 dark:bg-green-900 dark:text-green-200'
										} else if (change < 0) {
											badgeColor = 'bg-red-200 text-red-700 dark:bg-red-900 dark:text-red-200'
										}

										return (
											<span className={`text-xs font-semibold px-2 py-0.5 rounded ${badgeColor} ml-2`} >
												{change > 0 ? '+' : ''}{change}
											</span>
										)
									})()}
								</div>
							</div>
						</div>
					</div>
				</ResizablePanel>
			</ResizablePanelGroup>
		</div>
	)
}