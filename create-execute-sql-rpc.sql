-- Create execute_sql RPC function for Supabase MCP Server
-- This function allows the MCP server to execute arbitrary SQL

CREATE OR REPLACE FUNCTION execute_sql(sql_query text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result jsonb := '[]'::jsonb;
    rec record;
BEGIN
    -- Handle different types of SQL commands
    
    -- DDL Commands (CREATE, ALTER, DROP)
    IF sql_query ~* '^\s*(CREATE|ALTER|DROP|GRANT)' THEN
        EXECUTE sql_query;
        RETURN jsonb_build_object(
            'success', true,
            'message', 'DDL command executed successfully'
        );
    END IF;
    
    -- SELECT queries
    IF sql_query ~* '^\s*SELECT' THEN
        result := '[]'::jsonb;
        FOR rec IN EXECUTE sql_query LOOP
            result := result || to_jsonb(rec);
        END LOOP;
        RETURN jsonb_build_object(
            'success', true,
            'data', result
        );
    END IF;
    
    -- INSERT, UPDATE, DELETE
    IF sql_query ~* '^\s*(INSERT|UPDATE|DELETE)' THEN
        EXECUTE sql_query;
        GET DIAGNOSTICS result = ROW_COUNT;
        RETURN jsonb_build_object(
            'success', true,
            'rows_affected', result
        );
    END IF;
    
    -- Default case - try to execute
    EXECUTE sql_query;
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Command executed'
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM,
            'error_code', SQLSTATE
        );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION execute_sql(text) TO service_role;
GRANT EXECUTE ON FUNCTION execute_sql(text) TO authenticated;