-- AppleScript for Claude Code Screenshot Integration
-- This script handles the workflow of taking a screenshot and preparing it for Claude Code

on run argv
    -- Get optional arguments for screenshot type and prompt template
    set screenshotType to "area" -- default
    set promptTemplate to "quick" -- default
    
    if (count of argv) > 0 then
        set screenshotType to item 1 of argv
    end if
    
    if (count of argv) > 1 then
        set promptTemplate to item 2 of argv
    end if
    
    -- Take screenshot based on type
    takeScreenshot(screenshotType)
    
    -- Wait a moment for screenshot to be captured
    delay 0.5
    
    -- Focus or open Claude Code
    focusClaudeCode()
    
    -- Paste screenshot with appropriate prompt
    pasteWithPrompt(promptTemplate)
    
end run

-- Function to take screenshot using Shottr or native macOS
on takeScreenshot(screenshotType)
    try
        -- Try to use Shottr first
        if application "Shottr" is running then
            tell application "Shottr"
                activate
                if screenshotType is "area" then
                    -- Shottr area screenshot (will auto-copy to clipboard)
                    key code 53 using {command down, shift down, control down} -- Escape to close any open panels
                    delay 0.2
                    key code 23 using {command down, shift down} -- Cmd+Shift+4 equivalent in Shottr
                else if screenshotType is "window" then
                    -- Shottr window screenshot
                    key code 23 using {command down, shift down, option down}
                else if screenshotType is "full" then
                    -- Shottr full screen screenshot
                    key code 21 using {command down, shift down} -- Cmd+Shift+3 equivalent
                end if
            end tell
        else
            -- Fallback to native macOS screenshots with clipboard copy
            if screenshotType is "area" then
                do shell script "screencapture -i -c" -- Interactive area selection to clipboard
            else if screenshotType is "window" then
                do shell script "screencapture -i -w -c" -- Interactive window selection to clipboard
            else if screenshotType is "full" then
                do shell script "screencapture -c" -- Full screen to clipboard
            end if
        end if
        
        -- Show notification
        display notification "Screenshot captured and copied to clipboard" with title "Claude Code Screenshot" sound name "Glass"
        
    on error errMsg
        display notification "Error capturing screenshot: " & errMsg with title "Screenshot Error" sound name "Basso"
    end try
end takeScreenshot

-- Function to focus or open Claude Code
on focusClaudeCode()
    try
        -- Check if Claude Code is running in Terminal
        tell application "System Events"
            set terminalProcesses to (name of every process whose name contains "Terminal")
        end tell
        
        if (count of terminalProcesses) > 0 then
            tell application "Terminal"
                activate
                -- Bring Terminal to front
                set frontmost to true
            end tell
            
            -- Brief delay to allow Terminal to come to front
            delay 0.3
            
        else
            -- Open Terminal and start Claude Code
            tell application "Terminal"
                activate
                set newTab to do script "cd /Users/bradjohnson/Documents/anoint-array/WEBSITE/anoint-array && claude"
            end tell
            
            -- Longer delay for Claude Code to start
            delay 2
        end if
        
    on error errMsg
        display notification "Error opening Claude Code: " & errMsg with title "Claude Code Error" sound name "Basso"
    end try
end focusClaudeCode

-- Function to paste screenshot with prompt template
on pasteWithPrompt(templateType)
    try
        -- Small delay to ensure Claude Code is ready
        delay 0.5
        
        -- Paste the screenshot using Ctrl+V (not Cmd+V for Claude Code)
        tell application "System Events"
            key code 9 using {control down} -- Ctrl+V
        end tell
        
        -- Wait for image to be processed
        delay 1
        
        -- Add appropriate prompt based on template type
        tell application "System Events"
            -- Press Enter to go to new line
            key code 36 -- Return/Enter
            delay 0.2
            
            -- Type the slash command for the appropriate template
            if templateType is "ui" then
                keystroke "/screenshot-ui-feedback"
            else if templateType is "debug" then
                keystroke "/screenshot-debug"
            else if templateType is "design" then
                keystroke "/screenshot-design"
            else
                keystroke "/screenshot-quick"
            end if
            
            -- Press Enter to execute the command
            delay 0.2
            key code 36 -- Return/Enter
        end tell
        
        -- Show success notification
        display notification "Screenshot pasted with " & templateType & " template" with title "Claude Code Ready" sound name "Purr"
        
    on error errMsg
        display notification "Error pasting screenshot: " & errMsg with title "Paste Error" sound name "Basso"
    end try
end pasteWithPrompt