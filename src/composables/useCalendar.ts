export const useCalendar = () => {
    const createGoogleCalendarUrl = (event: {
        title: string
        description?: string
        location?: string
        start: Date
        end?: Date
    }) => {
        const startTime = event.start.toISOString().replace(/-|:|\.\d\d\d/g, '')
        const endTime = (event.end || new Date(event.start.getTime() + 60 * 60 * 1000))
            .toISOString()
            .replace(/-|:|\.\d\d\d/g, '')

        const params = new URLSearchParams({
            action: 'TEMPLATE',
            text: event.title,
            details: event.description || '',
            location: event.location || '',
            dates: `${startTime}/${endTime}`
        })

        return `https://calendar.google.com/calendar/render?${params.toString()}`
    }

    const downloadIcsFile = (event: {
        title: string
        description?: string
        location?: string
        start: Date
        end?: Date
    }) => {
        const startTime = event.start.toISOString().replace(/-|:|\.\d\d\d/g, '')
        const endTime = (event.end || new Date(event.start.getTime() + 60 * 60 * 1000))
            .toISOString()
            .replace(/-|:|\.\d\d\d/g, '')

        const icsContent = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'BEGIN:VEVENT',
            `DTSTART:${startTime}`,
            `DTEND:${endTime}`,
            `SUMMARY:${event.title}`,
            `DESCRIPTION:${event.description || ''}`,
            `LOCATION:${event.location || ''}`,
            'END:VEVENT',
            'END:VCALENDAR'
        ].join('\n')

        const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
        const link = document.createElement('a')
        link.href = window.URL.createObjectURL(blob)
        link.setAttribute('download', `${event.title.replace(/\s+/g, '_')}.ics`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    return {
        createGoogleCalendarUrl,
        downloadIcsFile
    }
}
